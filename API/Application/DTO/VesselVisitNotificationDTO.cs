namespace Application.DTO;

using System.Text.Json.Serialization;


using Domain.Model;


public class VesselVisitNotificationDTO
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
        public VesselRecordDTO? Vessel { get; set; }
        public long VesselId { get; set; }
    public string VesselIMO { get; set; } = null!;
    public string RepresentativeCitizenID { get; set; } = null!;
    public DateTime Eta { get; set; }
    public DateTime Etd { get; set; }
    public List<CargoManifestDTO>? CargoManifests { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public CargoType CargoType { get; set; }
    public double Volume { get; set; }
    public List<CrewMemberDTO> CrewMembers { get; set; } = null!;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public VisitStatus VisitStatus { get; set; }

    public DateTime LastModifiedAt { get; set; }

    public int NumberOfCrewMembers { get; set; }

    public DockDTO? AssignedDock { get; set; } = null;
    public List<DockReassignmentLogDTO> DockReassignmentLogs { get; set; } = new List<DockReassignmentLogDTO>();


    private VesselVisitNotificationDTO() { }


    public VesselVisitNotificationDTO(long id, string code, string vesselIMO, string representativeCitizenID, DateTime eta, DateTime etd, List<CargoManifestDTO>? cargoManifests, CargoType cargoType, double volume, List<CrewMemberDTO> crewMembers, VisitStatus visitStatus, int numberOfCrewMembers)
    {
        Id = id;
        Code = code;
        VesselIMO = vesselIMO;
        RepresentativeCitizenID = representativeCitizenID;
        Eta = eta;
        Etd = etd;
        CargoManifests = cargoManifests;
        CargoType = cargoType;
        Volume = volume;
        CrewMembers = crewMembers;
        VisitStatus = visitStatus;
        NumberOfCrewMembers = numberOfCrewMembers;
    }

    static public VesselVisitNotificationDTO ToDTO(VesselVisitNotification vesselVisitNotification)
    {
        try
        {
            List<CargoManifestDTO> cargoManifestDTOs = new List<CargoManifestDTO>();
            foreach (CargoManifest cargoManifest in vesselVisitNotification.CargoManifests)
            {
                CargoManifestDTO cargoManifestDTO = new CargoManifestDTO
                {
                    ManifestType = cargoManifest.ManifestType,
                    Entries = cargoManifest.Entries!.Select(e => new CargoManifestEntryDTO
                    {
                        ContainerNumber = e.Container.ContainerNumber,
                        Row = e.Row,
                        Tier = e.Tier,
                        Bay = e.Bay,
                        StorageAreaCode = e.StorageArea.Code
                    }).ToList()
                };
                cargoManifestDTOs.Add(cargoManifestDTO);
            }

            List<CrewMemberDTO> crewMemberDTOs = vesselVisitNotification.CrewMembers.Select(cm => new CrewMemberDTO
            {
                Name = cm.Name,
                CitizenID = cm.CitizenId,
                Rank = cm.Rank,
                Nationality = cm.Nationality
            }
            ).ToList();
            VesselVisitNotificationDTO vesselVisitNotificationDTO = new VesselVisitNotificationDTO(vesselVisitNotification.Id, vesselVisitNotification.Code, vesselVisitNotification.Vessel.IMONumber!, vesselVisitNotification.Representative.CitizenId!, vesselVisitNotification.ETA, vesselVisitNotification.ETD, cargoManifestDTOs, vesselVisitNotification.CargoType, vesselVisitNotification.Volume, crewMemberDTOs, vesselVisitNotification.VisitStatus, vesselVisitNotification.NumberOfCrewMembers);
            vesselVisitNotificationDTO.LastModifiedAt = vesselVisitNotification.LastModifiedAt;
            vesselVisitNotificationDTO.Vessel = VesselRecordDTO.ToDTO(vesselVisitNotification.Vessel);
            vesselVisitNotificationDTO.VesselId = vesselVisitNotification.VesselId;

            if (vesselVisitNotification.AssignedDock != null)
            {
                vesselVisitNotificationDTO.AssignedDock = DockDTO.ToDTO(vesselVisitNotification.AssignedDock);
            }

            if (vesselVisitNotification.DockReassignmentLogs != null && vesselVisitNotification.DockReassignmentLogs.Count > 0)
            {
                vesselVisitNotificationDTO.DockReassignmentLogs = DockReassignmentLogDTO.ToDTO(vesselVisitNotification.DockReassignmentLogs).ToList();
            }
            return vesselVisitNotificationDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to VesselVisitNotificationDTO: {ex.Message}");
        }
    }

    static public IEnumerable<VesselVisitNotificationDTO> ToDTO(IEnumerable<VesselVisitNotification> vesselVisitNotifications)
    {
        List<VesselVisitNotificationDTO> vesselVisitNotificationDTOs = new List<VesselVisitNotificationDTO>();
        foreach (VesselVisitNotification vesselVisitNotification in vesselVisitNotifications)
        {
            VesselVisitNotificationDTO vesselVisitNotificationDTO = ToDTO(vesselVisitNotification);
            vesselVisitNotificationDTOs.Add(vesselVisitNotificationDTO);
        }
        return vesselVisitNotificationDTOs;
    }
}