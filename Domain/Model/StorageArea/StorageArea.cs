namespace Domain.Model;


public enum StorageAreaType
{
    Yard,
    Warehouse
}

public class StorageArea
{
    public long Id { get; set; }

    public string Code { get; private set; } = string.Empty;

    public string Location { get; private set; } = string.Empty;

    public StorageAreaType Type { get; private set; }

    public int MaxCapacity { get; private set; }

    public int CurrentCapacity { get; private set; }

    public List<StorageAreaDock> StorageAreaDocks { get; private set; } = new List<StorageAreaDock>();

    public DateTime LastModifiedAt { get; set; }

    private StorageArea() { }


    public StorageArea(string code, string location, StorageAreaType type, int maxCapacity, int currentCapacity)
    {

        ValidateCode(code);
        code.ToUpper().Trim();
        ValidateLocation(location);
        ValidateMaxCapacity(maxCapacity);
        ValidateCurrentCapacity(currentCapacity, maxCapacity);
        Code = code;
        Location = location;
        Type = type;
        MaxCapacity = maxCapacity;
        CurrentCapacity = currentCapacity;
        LastModifiedAt = DateTime.UtcNow;
    }


    public void ValidateCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Storage area code cannot be null or empty.", nameof(code));
        }

        if (!System.Text.RegularExpressions.Regex.IsMatch(code, "^[a-zA-Z0-9]+$"))
        {
            throw new ArgumentException("Storage area code must be alphanumeric (letters and digits only).", nameof(code));
        }
    }

    public void ValidateLocation(string location)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            throw new ArgumentException("Storage area location cannot be null or empty.", nameof(location));
        }
    }

    public void ValidateMaxCapacity(int maxCapacity)
    {
        if (maxCapacity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(maxCapacity), "Max capacity must be greater than zero.");
        }
    }

    public void ValidateCurrentCapacity(int currentCapacity, int maxCapacity)
    {
        if (currentCapacity < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(currentCapacity), "Current capacity cannot be negative.");
        }
        if (currentCapacity > maxCapacity)
        {
            throw new ArgumentOutOfRangeException(nameof(currentCapacity), "Current capacity cannot exceed max capacity.");
        }
    }


    public void ChangeLocation(string location)
    {
        ValidateLocation(location);
        Location = location;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeMaxCapacity(int maxCapacity)
    {
        ValidateMaxCapacity(maxCapacity);
        ValidateCurrentCapacity(CurrentCapacity, maxCapacity);
        MaxCapacity = maxCapacity;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeCurrentCapacity(int currentCapacity)
    {
        ValidateCurrentCapacity(currentCapacity, MaxCapacity);
        CurrentCapacity = currentCapacity;
        LastModifiedAt = DateTime.UtcNow;
    }


    public void AddStorageAreaDock(Dock dock, double distance)
    {
        if (StorageAreaDocks.Any(sd => sd.DockId == dock.Id))
        {
            throw new InvalidOperationException($"Dock with ID {dock.Id} is already associated with this storage area.");
        }
        StorageAreaDock storageAreaDock = new StorageAreaDock(this, dock, distance);
        if (storageAreaDock != null)
        {
            StorageAreaDocks.Add(storageAreaDock);
            LastModifiedAt = DateTime.UtcNow;
        }
    }

}