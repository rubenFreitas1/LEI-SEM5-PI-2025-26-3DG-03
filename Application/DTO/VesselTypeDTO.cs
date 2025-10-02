namespace Application.DTO;

using Domain.Model;
using ShippingManagement.Domain.Vessels;

public class VesselTypeDTO
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int Capacity { get; set; }
    public int MaxRows { get; set; }
    public int MaxBays { get; set; }
    public int MaxTiers { get; set; }

    public VesselTypeDTO() { }

    public VesselTypeDTO(string name, string description, int capacity, int maxRows, int maxBays, int maxTiers)
    {
        Name = name;
        Description = description;
        Capacity = capacity;
        MaxRows = maxRows;
        MaxBays = maxBays;
        MaxTiers = maxTiers;
    }

    static public VesselTypeDTO ToDTO(VesselType vesselType)
    {
        VesselTypeDTO vesselTypeDTO = new VesselTypeDTO(vesselType.Name!, vesselType.Description!, vesselType.Capacity, vesselType.MaxRows, vesselType.MaxBays, vesselType.MaxTiers);
        return vesselTypeDTO;
    }

    static public IEnumerable<VesselTypeDTO> ToDTO(IEnumerable<VesselType> vesselTypes)
    {
        List<VesselTypeDTO> vesselTypeDTOs = new List<VesselTypeDTO>();
        foreach (VesselType vesselType in vesselTypes)
        {
            VesselTypeDTO vesselTypeDTO = ToDTO(vesselType);
            vesselTypeDTOs.Add(vesselTypeDTO);
        }
        return vesselTypeDTOs;
    }


    static public VesselType ToDomain(VesselTypeDTO vesselTypeDTO)
    {
        if (vesselTypeDTO.Name is null) throw new InvalidOperationException("VesselType.Name não pode ser null");
        if (vesselTypeDTO.Description is null) throw new InvalidOperationException("VesselType.Description não pode ser null");
        VesselType vesselType = new VesselType(vesselTypeDTO.Name, vesselTypeDTO.Description, vesselTypeDTO.Capacity, vesselTypeDTO.MaxRows, vesselTypeDTO.MaxBays, vesselTypeDTO.MaxTiers);
        return vesselType;
    }

    static public VesselType UpdateToDomain(VesselType vesselType, VesselTypeDTO vesselTypeDTO)
    {
        vesselType.ChangeName(vesselTypeDTO.Name!);
        vesselType.ChangeDescription(vesselTypeDTO.Description!);
        vesselType.ChangeCapacity(vesselTypeDTO.Capacity);
        vesselType.ChangeMaxRows(vesselTypeDTO.MaxRows);
        vesselType.ChangeMaxBays(vesselTypeDTO.MaxBays);
        vesselType.ChangeMaxTiers(vesselTypeDTO.MaxTiers);
        return vesselType;
    }
}