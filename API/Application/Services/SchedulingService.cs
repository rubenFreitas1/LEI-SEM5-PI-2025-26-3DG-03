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

    public async Task<SchedulingDTO?> GetSchedulingForTargetDay(DateTime targetDay, List<string> errorMessages)
    {
        IEnumerable<VesselVisitNotification> notifications = await _vesselVisitNotificationRepository.GetVisitsByTargetDay_StatusAsync(targetDay, VisitStatus.Approved);
        if (!notifications.Any())
        {
            errorMessages.Add("No vessel visit notifications found for the target day.");
            return null;
        }
        Dock? dockAssigned = notifications.First().AssignedDock;
        string assignedDockName = dockAssigned?.Name ?? string.Empty;


        IEnumerable<PhysicalResource> physicalResources = await _physicalResourceRepository.SearchAsync(kind: PhysicalResourceKind.STSCrane, assignedDock: assignedDockName, status: ResourceStatus.Available);
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


        string endpoint = _configuration["Scheduling:Endpoint"] ?? "http://localhost:6000/api/scheduling/compute";
        try
        {
            using var client = new HttpClient();
            var json = JsonSerializer.Serialize(
                dataScheduleDTO,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
            );
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await client.PostAsync(endpoint, content);
            response.EnsureSuccessStatusCode();
            var responseJson = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(responseJson);

            var scheduleArray = doc.RootElement
                .GetProperty("schedule")
                .GetProperty("schedule")
                .EnumerateArray();

            int totalDelay = doc.RootElement
                .GetProperty("schedule")
                .GetProperty("totalDelay")
                .GetInt32();
            var entries = new List<SchedulingEntryDTO>();
            foreach (var item in scheduleArray)
            {
                string vesselIMO = item.GetProperty("vessel").GetString() ?? string.Empty;

                int startHours = item.GetProperty("start").GetInt32();
                int endHours = item.GetProperty("end").GetInt32();
                DateTime startTime = targetDay.AddHours(startHours);
                DateTime endTime = targetDay.AddHours(endHours);
                string vesselName = GetVesselNameByIMO(vesselIMO).Result;
                List<string> assignedCranes = [fastestCrane.Name];
                List<string> staffNames = await GetAvailableStaffNames();

                var schedulingEntryDTO = new SchedulingEntryDTO(vesselName, startTime, endTime, assignedCranes, staffNames);
                entries.Add(schedulingEntryDTO);
            }
            var schedulingDTO = new SchedulingDTO(entries, totalDelay);
            return schedulingDTO;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
        return null;
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