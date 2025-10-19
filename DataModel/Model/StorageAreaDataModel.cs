namespace DataModel.Model;


using Domain.Model;


public class StorageAreaDataModel
{
    public long Id { get; set; }
    public string? Code { get; set; }
    public string? Location { get; set; }
    public string? Type { get; set; }
    public int MaxCapacity { get; set; }
    public int CurrentCapacity { get; set; }
    public DateTime LastModifiedAt { get; set; }

    public List<StorageAreaDockDataModel>? StorageAreaDocks { get; set; }

    public StorageAreaDataModel() { }

    public StorageAreaDataModel(StorageArea storageArea)
    {
        Id = storageArea.Id;
        Code = storageArea.Code;
        Location = storageArea.Location;
        Type = storageArea.Type.ToString();
        MaxCapacity = storageArea.MaxCapacity;
        CurrentCapacity = storageArea.CurrentCapacity;
        LastModifiedAt = storageArea.LastModifiedAt;
        StorageAreaDocks = storageArea.StorageAreaDocks?.ConvertAll(sad => new StorageAreaDockDataModel(sad));
    }
    
}