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
        IEnumerable<PhysicalResource> physicalResources = (cranesByKind ?? Enumerable.Empty<PhysicalResource>())
            .Where(p => (p.PhysicalResourceAssignedDockName ?? string.Empty) == assignedDockName && p.Status == ResourceStatus.Available);
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

        DataScheduleDTO dataScheduleDTO = new DataScheduleDTO(notificationDTOs.ToList(), fastestCraneDTO);


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

            var scheduleArray = doc.RootElement
                .GetProperty("schedule")
                .GetProperty("schedule")
                .EnumerateArray();

            int totalDelay = doc.RootElement
                .GetProperty("schedule")
                .GetProperty("totalDelay")
                .GetInt32();
            double executionTime = doc.RootElement
                .GetProperty("schedule")
                .GetProperty("executionTime")
                .GetDouble();
            var entries = new List<SchedulingEntryDTO>();
            foreach (var item in scheduleArray)
            {
                string vesselIMO = item.GetProperty("vessel").GetString() ?? string.Empty;

                int startHours = item.GetProperty("start").GetInt32();
                int endHours = item.GetProperty("end").GetInt32();
                DateTime startTime = targetDay.AddHours(startHours);
                DateTime endTime = targetDay.AddHours(endHours);
                string vesselName = GetVesselNameByIMO(vesselIMO).Result;
                var assignedCranes = new List<string> { fastestCrane.Name };
                List<string> staffNames = await GetAvailableStaffNames();

                var schedulingEntryDTO = new SchedulingEntryDTO(vesselName, startTime, endTime, assignedCranes, staffNames);
                entries.Add(schedulingEntryDTO);
            }
            var schedulingDTO = new SchedulingDTO(entries, totalDelay, executionTime);
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

}