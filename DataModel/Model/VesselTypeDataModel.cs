using System.ComponentModel.DataAnnotations;
using ShippingManagement.Domain.Vessels;

namespace DataModel.Model;

public class VesselTypeDataModel
{

    public long Id { get; set; }

    [Required]
    public string? Name { get; set; }

    [Required]
    public string? Description { get; set; }

    [Required]
    public int Capacity { get; set; }

    [Required]
    public int MaxRows { get; set; }

    [Required]
    public int MaxBays { get; set; }

    [Required]
    public int MaxTiers { get; set; }

    public VesselTypeDataModel() { }

    public VesselTypeDataModel(VesselType vesselType)
    {
        Id = vesselType.Id;
        Name = vesselType.Name;
        Description = vesselType.Description;
        Capacity = vesselType.Capacity;
        MaxRows = vesselType.MaxRows;
        MaxBays = vesselType.MaxBays;
        MaxTiers = vesselType.MaxTiers;
    }

}