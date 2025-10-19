using DataModel.Repository;
using Microsoft.Extensions.DependencyInjection;
namespace WebApi.Helpers;

using DataModel.Model;
using Domain.Model;


public static class Utilities
{

    public static void InitializeDbForApp(WebApplication app)
    {
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ShippingManagementContext>();
            if (!db.VesselTypes.Any())
            {
                db.VesselTypes.AddRange(GetSeedingVesselTypesDataModel());
                db.SaveChanges();
            }
            if (!db.Docks.Any())
            {
                var vesselTypes = db.VesselTypes.ToList(); // agora já existem
                db.Docks.AddRange(GetSeedingDocksDataModel(vesselTypes));
                db.SaveChanges();
            }
            if (!db.StorageAreas.Any())
            {
                var docks = db.Docks.ToList();
                db.StorageAreas.AddRange(GetSeedingStorageAreasDataModel(docks));
                db.SaveChanges();
            }
        }
    }

    public static List<VesselTypeDataModel> GetSeedingVesselTypesDataModel()
    {
        return new List<VesselTypeDataModel>()
        {
            new VesselTypeDataModel(new VesselType("Large Container Ships", "Large container ship", 300, 10,10,10)),
            new VesselTypeDataModel(new VesselType("Small Container Ships", "Small container ship", 100, 10,5,5)),
            new VesselTypeDataModel(new VesselType("General Cargo", "General cargo ship", 200, 10,10,100))
        };
    }

    public static List<DockDataModel> GetSeedingDocksDataModel(List<VesselTypeDataModel> vesselTypes)
    {
        return new List<DockDataModel>()
        {
            new DockDataModel
            {
                Name = "Dock A",
                Location = "Port 1",
                Length = 500,
                Depth = 30,
                MaxDraft = 15,
                VesselTypesAllowed = new List<VesselTypeDataModel> { vesselTypes[0], vesselTypes[1] },
                LastModifiedAt = DateTime.UtcNow
            },
            new DockDataModel
            {
                Name = "Dock B",
                Location = "Port 2",
                Length = 300,
                Depth = 20,
                MaxDraft = 10,
                VesselTypesAllowed = new List<VesselTypeDataModel> { vesselTypes[0], vesselTypes[1], vesselTypes[2] },
                LastModifiedAt = DateTime.UtcNow
            },
        };
    }

    public static List<StorageAreaDataModel> GetSeedingStorageAreasDataModel(List<DockDataModel> docks)
    {
        DockDataModel? find(string name) => docks.FirstOrDefault(d => string.Equals(d.Name, name, StringComparison.OrdinalIgnoreCase));

        var storageAreas = new List<StorageAreaDataModel>();

        var wh1 = new StorageAreaDataModel
        {
            Code = "WH001",
            Location = "Warehouse 1",
            Type = "Warehouse",
            MaxCapacity = 1000,
            CurrentCapacity = 200,
            LastModifiedAt = DateTime.UtcNow,
            StorageAreaDocks = new List<StorageAreaDockDataModel>()
        };
        var dockA = find("Dock A");
        var dockB = find("Dock B");
        if (dockA != null) wh1.StorageAreaDocks.Add(new StorageAreaDockDataModel { Dock = dockA, Distance = 10 });
        if (dockB != null) wh1.StorageAreaDocks.Add(new StorageAreaDockDataModel { Dock = dockB, Distance = 40 });

        var wh2 = new StorageAreaDataModel
        {
            Code = "WH002",
            Location = "Warehouse 2",
            Type = "Warehouse",
            MaxCapacity = 2000,
            CurrentCapacity = 500,
            LastModifiedAt = DateTime.UtcNow,
            StorageAreaDocks = new List<StorageAreaDockDataModel>()
        };
        if (dockA != null) wh2.StorageAreaDocks.Add(new StorageAreaDockDataModel { Dock = dockA, Distance = 20 });
        if (dockB != null) wh2.StorageAreaDocks.Add(new StorageAreaDockDataModel { Dock = dockB, Distance = 30 });

        storageAreas.Add(wh1);
        storageAreas.Add(wh2);

        return storageAreas;
    }
}