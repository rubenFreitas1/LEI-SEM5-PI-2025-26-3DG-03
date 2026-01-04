namespace Application.DTO;


public class SchedulingEntryDTO
{
    public String VesselName { get; set; }
    
    public String? VVNCode { get; set; }

    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public List<String> AssignedCranes { get; set; }

    public List<String> StaffNames { get; set; }

    public SchedulingEntryDTO(string vesselName, DateTime startTime, DateTime endTime, List<String> assignedCrane, List<String> staffNames, string? vvnCode = null)
    {
        VesselName = vesselName;
        VVNCode = vvnCode;
        StartTime = startTime;
        EndTime = endTime;
        AssignedCranes = assignedCrane;
        StaffNames = staffNames;
    }

}