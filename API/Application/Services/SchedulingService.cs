namespace Application.Services;

using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Linq;
using System.Threading.Tasks;
using Domain.Model;
using Domain.IRepository;
using Application.DTO;
using Domain.Factory;
using Domain.Model.Resources;
using Microsoft.Extensions.Configuration;

public class SchedulingService
{

    private readonly IVesselVisitNotificationRepository _vesselVisitNotificationRepository;
    private readonly IStorageAreaRepository _storageAreaRepository;
    private readonly IStaffRepository _staff_repository;

    private readonly IVesselRecordRepository _vesselRecordRepository;
    private readonly IPhysicalResourceRepository _physicalResourceRepository;
    private readonly IConfiguration _configuration;


    public SchedulingService(
        IVesselVisitNotificationRepository vesselVisitNotificationRepository,
        IStorageAreaRepository storageAreaRepository,
        IStaffRepository staffRepository,
        IPhysicalResourceRepository physicalResourceRepository,
        IConfiguration configuration,
        IVesselRecordRepository vesselRecordRepository
        )
    {
        _vesselVisitNotificationRepository = vesselVisitNotificationRepository;
        _storageAreaRepository = storageAreaRepository;
        _staff_repository = staffRepository;
        _physicalResourceRepository = physicalResourceRepository;
        _configuration = configuration;
        _vesselRecordRepository = vesselRecordRepository;
    }

    public async Task<SchedulingDTO?> GetSchedulingForTargetDay(DateTime targetDay, List<string> errorMessages, string algorithm = "default")
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByTargetDay_StatusAsync(targetDay, VisitStatus.Approved);
        if (!notifications.Any())
        {
            errorMessages.Add("No vessel visit notifications found for the target day.");
            return null;
        }
        Dock? dockAssigned = notifications.First().AssignedDock;
        string assignedDockName = dockAssigned?.Name ?? string.Empty;

        var cranesByKind = await _physicalResourceRepository.GetPhysicalResourceByKindAsync(PhysicalResourceKind.STSCrane);
        string dockToMatch = (assignedDockName ?? string.Empty).Trim();

        IEnumerable<PhysicalResource> physicalResources = (cranesByKind ?? Enumerable.Empty<PhysicalResource>())
            .Where(p => string.Equals((p.PhysicalResourceAssignedDockName ?? string.Empty).Trim(), dockToMatch, System.StringComparison.OrdinalIgnoreCase)
                        && p.Status == ResourceStatus.Available);
        PhysicalResource? fastestCrane = (physicalResources ?? Enumerable.Empty<PhysicalResource>())
            .OrderByDescending(c => c.PhysicalResourceOperationalCapacity)
            .FirstOrDefault();

        IEnumerable<VesselVisitNotificationDTO> notificationDTOs = VesselVisitNotificationDTO.ToDTO(notifications);
        PhysicalResourceDTO fastestCraneDTO;
        if (fastestCrane != null)
        {
            fastestCraneDTO = PhysicalResourceDTO.ToDTO(fastestCrane);
        }
        else
        {
            errorMessages.Add("No available STS Crane found for the assigned dock.");
            return null;
        }

        // compute number of available STS cranes for the dock and pass as maxCranes
        int availableCranes = (physicalResources ?? Enumerable.Empty<PhysicalResource>()).Count();
        DataScheduleDTO dataScheduleDTO = new DataScheduleDTO(notificationDTOs.ToList(), fastestCraneDTO, availableCranes);


        string configured = _configuration["Scheduling:Endpoint"] ?? "http://localhost:6000/";
        string baseEndpoint = configured;
        if (!baseEndpoint.EndsWith("/")) baseEndpoint += "/";
        string path = "api/scheduling/compute";
        var algNorm = (algorithm ?? "default").Trim();
        if (string.IsNullOrEmpty(algNorm)) algNorm = "default";
        var algParam = algNorm.ToLowerInvariant();
        if (algParam != "default" && algParam != "improved")
        {
            var msgInvalid = $"Unsupported algorithm '{algParam}'. Supported values: 'default' or 'improved'.";
            Console.WriteLine(msgInvalid);
            errorMessages.Add(msgInvalid);
            return null;
        }
        string endpoint = baseEndpoint + path + "?algorithm=" + System.Uri.EscapeDataString(algParam);
        Console.WriteLine($"SchedulingService: requested algorithm='{algParam}', calling Prolog endpoint: {endpoint}");
        try
        {
            using var client = new HttpClient();
            var json = JsonSerializer.Serialize(
                dataScheduleDTO,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(endpoint, content);
            if (!response.IsSuccessStatusCode)
            {
                var errBody = await response.Content.ReadAsStringAsync();
                var msg = $"Scheduling endpoint returned {(int)response.StatusCode} {response.ReasonPhrase}: {errBody}";
                Console.WriteLine(msg);
                errorMessages.Add(msg);
                return null;
            }
            var responseJson = await response.Content.ReadAsStringAsync();
            Console.WriteLine("Received scheduling response from Prolog:");
            Console.WriteLine(responseJson);
            var doc = JsonDocument.Parse(responseJson);
            var scheduleRoot = doc.RootElement.GetProperty("schedule");
            var scheduleArray = scheduleRoot
                .GetProperty("schedule")
                .EnumerateArray();

            int totalDelay = scheduleRoot
                .GetProperty("totalDelay")
                .GetInt32();
            double executionTime = scheduleRoot
                .GetProperty("executionTime")
                .GetDouble();

            // Extract messages if present
            var messages = new List<string>();
            if (scheduleRoot.TryGetProperty("messages", out var messagesEl) && messagesEl.ValueKind == JsonValueKind.Array)
            {
                foreach (var me in messagesEl.EnumerateArray())
                {
                    if (me.ValueKind == JsonValueKind.String) messages.Add(me.GetString() ?? string.Empty);
                    else messages.Add(me.ToString());
                }
            }
            var entries = new List<SchedulingEntryDTO>();
            foreach (var item in scheduleArray)
            {
                string vesselIMO = item.GetProperty("vessel").GetString() ?? string.Empty;

                // parse start (may be number, string, or array) — extract first integer, supporting nested arrays
                int startHours;
                var startEl = item.GetProperty("start");
                if (!TryExtractFirstInt(startEl, out startHours)) { errorMessages.Add("Invalid 'start' element in schedule entry"); return null; }

                // parse end (may be number, string, or array) — extract first integer, supporting nested arrays
                int endHours;
                var endEl = item.GetProperty("end");
                if (!TryExtractFirstInt(endEl, out endHours)) { errorMessages.Add("Invalid 'end' element in schedule entry"); return null; }
                DateTime startTime = targetDay.AddHours(startHours);
                DateTime endTime = targetDay.AddHours(endHours);
                string vesselName = GetVesselNameByIMO(vesselIMO).Result;
                var assignedCranes = new List<string> { fastestCrane.Name };
                List<string> staffNames = await GetAvailableStaffNames();

                var schedulingEntryDTO = new SchedulingEntryDTO(vesselName, startTime, endTime, assignedCranes, staffNames);
                entries.Add(schedulingEntryDTO);
            }
            var schedulingDTO = new SchedulingDTO(entries, totalDelay, executionTime, messages);
            return schedulingDTO;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex}");
            errorMessages.Add(ex.ToString());
            return null;
        }
    }
    private async Task<List<String>> GetAvailableStaffNames()
    {
        IEnumerable<Staff> availableStaff = await _staff_repository.GetStaffByQualificationCodeAsync("STSOP");
        return availableStaff.Select(s => s.Name).ToList();
    }

    private async Task<String> GetVesselNameByIMO(string imo)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(imo);
        if (vesselRecord == null)
        {
            Console.WriteLine($"VesselRecord not found for IMO: {imo}");
        }
        return vesselRecord!.VesselName!;
    }

    // Tries to extract the first integer value from a JsonElement.
    // Supports Number, String (parseable), Array (including nested arrays).
    private bool TryExtractFirstInt(JsonElement el, out int value)
    {
        value = 0;
        try
        {
            if (el.ValueKind == JsonValueKind.Number)
            {
                value = el.GetInt32();
                return true;
            }
            if (el.ValueKind == JsonValueKind.String)
            {
                if (int.TryParse(el.GetString(), out var v)) { value = v; return true; }
                return false;
            }
            if (el.ValueKind == JsonValueKind.Array)
            {
                foreach (var e in el.EnumerateArray())
                {
                    if (e.ValueKind == JsonValueKind.Number) { value = e.GetInt32(); return true; }
                    if (e.ValueKind == JsonValueKind.String && int.TryParse(e.GetString(), out var v2)) { value = v2; return true; }
                    if (e.ValueKind == JsonValueKind.Array)
                    {
                        if (TryExtractFirstInt(e, out var nested)) { value = nested; return true; }
                    }
                }
            }
        }
        catch
        {
            // ignore and return false below
        }
        return false;
    }

}