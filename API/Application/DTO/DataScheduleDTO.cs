namespace Application.DTO;


public class DataScheduleDTO
{
    public List<VesselVisitNotificationDTO> VesselVisitNotifications { get; set; }
    public PhysicalResourceDTO AssignedCrane { get; set; }
    public int MaxCranes { get; set; }

    public DataScheduleDTO(List<VesselVisitNotificationDTO> vesselVisitNotifications, PhysicalResourceDTO assignedCrane, int maxCranes)
    {
        VesselVisitNotifications = vesselVisitNotifications;
        AssignedCrane = assignedCrane;
        MaxCranes = maxCranes;
    }
}