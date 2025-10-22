namespace DataModel.Model;

using Domain.Model;



public class VesselVisitNotificationDataModel
{
    public long Id { get; set; }

    public string? Code { get; set; }

    public long VesselId { get; set; }
    public VesselRecordDataModel Vessel { get; set; } = null!;


    public long RepresentativeId { get; set; }
    public RepresentativeDataModel Representative { get; set; } = null!;

    public DateTime ETA { get; set; }

    public DateTime ETD { get; set; }

    public List<CargoManifestDataModel> CargoManifests { get; set; } = null!;

    public string? CargoType { get; set; }

    public double Volume { get; set; }

    public List<CrewMemberDataModel> CrewMembers { get; set; } = null!;

    public DockDataModel? AssignedDock { get; set; } = null;

    public string? VisitStatus { get; set; }

    public DateTime LastModifiedAt { get; set; }

    public int NumberOfCrewMembers { get; set; }

    public VesselVisitNotificationDataModel() { }

    public VesselVisitNotificationDataModel(VesselVisitNotification vesselVisitNotification)
    {
        Id = vesselVisitNotification.Id;
        Code = vesselVisitNotification.Code;
        VesselId = vesselVisitNotification.Vessel.Id;
        RepresentativeId = vesselVisitNotification.Representative.Id;
        ETA = vesselVisitNotification.ETA;
        ETD = vesselVisitNotification.ETD;
        CargoManifests = vesselVisitNotification.CargoManifests.ConvertAll(cm => new CargoManifestDataModel(cm));
        CargoType = vesselVisitNotification.CargoType.ToString();
        Volume = vesselVisitNotification.Volume;
        CrewMembers = vesselVisitNotification.CrewMembers.ConvertAll(cm => new CrewMemberDataModel(cm));
        AssignedDock = vesselVisitNotification.AssignedDock != null ? new DockDataModel(vesselVisitNotification.AssignedDock) : null;
        VisitStatus = vesselVisitNotification.VisitStatus.ToString();
        NumberOfCrewMembers = vesselVisitNotification.NumberOfCrewMembers;
    }
}