namespace Application.DTO;

using Domain.Model;


public class DockDTO
{
    public long Id { get; set; }
    public string? Name { get; set; }
    public string? Location { get; set; }

    public int Length { get; set; }

    public int Depth { get; set; }

    public int MaxDraft { get; set; }

    public List<string>? VesselTypesAllowed { get; set; }

    public DateTime LastModifiedAt { get; set; }


    public DockDTO() { }

    public DockDTO(long id, string name, string location, int length, int depth, int maxDraft, List<string> vesselTypesAllowed)
    {
        Id = id;
        Name = name;
        Location = location;
        Length = length;
        Depth = depth;
        MaxDraft = maxDraft;
        VesselTypesAllowed = vesselTypesAllowed;
    }

    static public DockDTO ToDTO(Dock dock)
    {
        try
        {
            DockDTO dockDTO = new DockDTO(dock.Id, dock.Name!, dock.Location!, dock.Length, dock.Depth, dock.MaxDraft, dock.VesselTypesAllowed!.Select(v => v.Name).ToList()!);
            return dockDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to DockDTO: {ex.Message}");
        }
    }

    static public IEnumerable<DockDTO> ToDTO(IEnumerable<Dock> docks)
    {
        List<DockDTO> dockDTOs = new List<DockDTO>();
        foreach (Dock dock in docks)
        {
            DockDTO dockDTO = ToDTO(dock);
            dockDTOs.Add(dockDTO);
        }
        return dockDTOs;
    }

}