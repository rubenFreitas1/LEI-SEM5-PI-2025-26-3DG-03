namespace Application.DTO;


public class SchedulingDTO
{
    public List<SchedulingEntryDTO> Entries { get; set; }

    public int TotalDelay { get; set; }

    public double ExecutionTime { get; set; }

        public List<string> Messages { get; set; }

    public SchedulingDTO(List<SchedulingEntryDTO> entries, int totalDelay, double executionTime, List<string>? messages = null)
    {
        Entries = entries;
        TotalDelay = totalDelay;
        ExecutionTime = executionTime;
        Messages = messages ?? new List<string>();
    }

}