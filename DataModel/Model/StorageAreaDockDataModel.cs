namespace DataModel.Model;

using Domain.Model;

public class StorageAreaDockDataModel
{
    public long StorageAreaId { get; set; }
    public StorageAreaDataModel StorageArea { get; set; } = null!;

    public long DockId { get; set; }
    public DockDataModel Dock { get; set; } = null!;

    public double Distance { get; set; }

    public StorageAreaDockDataModel() { }

    public StorageAreaDockDataModel(StorageAreaDock sad)
    {
        StorageAreaId = sad.StorageAreaId;
        DockId = sad.DockId;
        Distance = sad.Distance;
    }
}