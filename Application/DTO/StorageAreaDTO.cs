namespace Application.DTO;

using Domain.Model;

public class StorageAreaDTO
{
    public long Id { get; set; }
    public string Code { get;  set; } = string.Empty;

    public string Location { get;  set; } = string.Empty;

    public StorageAreaType StorageAreaType { get;  set; }

    public int MaxCapacity { get;  set; }

    public int CurrentCapacity { get; set; }  

    public List<StorageAreaDockDTO>? StorageAreaDocks { get; set; }

    public DateTime LastModifiedAt { get; set; }

    public StorageAreaDTO(){}

    public StorageAreaDTO(long id, string code, string location, StorageAreaType type, int maxCapacity, int currentCapacity, List<StorageAreaDockDTO> storageAreaDocks)
    {
        Id = id;
        Code = code;
        Location = location;
        StorageAreaType = type;
        MaxCapacity = maxCapacity;
        CurrentCapacity = currentCapacity;
        StorageAreaDocks = storageAreaDocks;
    }

    static public StorageAreaDTO ToDTO(StorageArea storageArea)
    {
        try
        {
            StorageAreaDTO storageAreaDTO = new StorageAreaDTO(storageArea.Id, storageArea.Code, storageArea.Location, storageArea.Type, storageArea.MaxCapacity, storageArea.CurrentCapacity, storageArea.StorageAreaDocks!.Select(d => new StorageAreaDockDTO { DockName = d.Dock.Name!, Distance = d.Distance }).ToList());
            storageAreaDTO.LastModifiedAt = storageArea.LastModifiedAt;
            return storageAreaDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to StorageAreaDTO: {ex.Message}");
        }
    }

    static public IEnumerable<StorageAreaDTO> ToDTO(IEnumerable<StorageArea> storageAreas)
    {
        List<StorageAreaDTO> storageAreaDTOs = new List<StorageAreaDTO>();
        foreach (StorageArea storageArea in storageAreas)
        {
            StorageAreaDTO storageAreaDTO = ToDTO(storageArea);
            storageAreaDTOs.Add(storageAreaDTO);
        }
        return storageAreaDTOs;
    }
}