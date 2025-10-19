namespace Domain.Model;


public class StorageAreaDock
{
    public long StorageAreaId { get; private set; }
    public StorageArea StorageArea { get; private set; } = null!;

    public long DockId { get; private set; }
    public Dock Dock { get; private set; } = null!;

    public double Distance { get; private set; }

    private StorageAreaDock() { }


    public StorageAreaDock(StorageArea storageArea, Dock dock, double distance)
    {
        ValidateStorageArea(storageArea);
        ValidateDock(dock);
        ValidateDistance(distance);

        StorageArea = storageArea;
        Dock = dock;
        StorageAreaId = storageArea.Id;
        DockId = dock.Id;
        Distance = distance;
    }

    public void ValidateDistance(double distance)
    {
        if (distance <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(distance), "Distance cannot be negative neihter zero.");
        }
    }

    public void ValidateStorageArea(StorageArea storageArea)
    {
        if (storageArea == null)
        {
            throw new ArgumentNullException(nameof(storageArea), "Storage area cannot be null.");
        }
    }


    public void ValidateDock(Dock dock)
    {
        if (dock == null)
        {
            throw new ArgumentNullException(nameof(dock), "Dock cannot be null.");
        }
    }

}
