namespace DataModel.Model;

using System.ComponentModel.DataAnnotations;

using Domain.Model;

public class DockDataModel
{
    public DateTime LastModifiedAt { get; set; }
    public long Id { get; set; }

    [Required]
    public string? Name { get; set; }

    [Required]
    public string? Location { get; set; }

    [Required]
    public int Length { get; set; }

    [Required]
    public int Depth { get; set; }

    [Required]
    public int MaxDraft { get; set; }

    [Required]
    public List<VesselTypeDataModel>? VesselTypesAllowed { get; set; }

    public DockDataModel() { }

    public DockDataModel(Dock dock)
    {
        Id = dock.Id;
        Name = dock.Name;
        Location = dock.Location;
        Length = dock.Length;
        Depth = dock.Depth;
        MaxDraft = dock.MaxDraft;
        VesselTypesAllowed = dock.VesselTypesAllowed?.ConvertAll(vt => new VesselTypeDataModel(vt));
        LastModifiedAt = dock.LastModifiedAt;
    }
}
