namespace DataModel.Mapper;

using DataModel.Model;

using Domain.Model;
using Domain.Factory;
using DataModel.Repository;
using Microsoft.EntityFrameworkCore;


public class StorageAreaMapper
{
    private readonly IStorageAreaFactory _storageAreaFactory;
    private readonly DockMapper _dockMapper;

    public StorageAreaMapper(IStorageAreaFactory storageAreaFactory, DockMapper dockMapper)
    {
        _storageAreaFactory = storageAreaFactory;
        _dockMapper = dockMapper;
    }

    public StorageArea ToDomain(StorageAreaDataModel storageAreaDM)
    {
        StorageArea storageAreaDomain = _storageAreaFactory.NewStorageArea(
            storageAreaDM.Code!,
            storageAreaDM.Location!,
            Enum.Parse<StorageAreaType>(storageAreaDM.Type!),
            storageAreaDM.MaxCapacity,
            storageAreaDM.CurrentCapacity)
        ;
        storageAreaDomain.Id = storageAreaDM.Id;
        storageAreaDomain.LastModifiedAt = storageAreaDM.LastModifiedAt;

        if (storageAreaDM.StorageAreaDocks != null)
        {
            foreach (var sad in storageAreaDM.StorageAreaDocks)
            {
                var dockDomain = _dockMapper.ToDomain(sad.Dock!);
                storageAreaDomain.StorageAreaDocks.Add(new StorageAreaDock(storageAreaDomain, dockDomain, sad.Distance));
            }
        }

        return storageAreaDomain;
    }

    public IEnumerable<StorageArea> ToDomain(IEnumerable<StorageAreaDataModel> storageAreaDataModels)
    {
        List<StorageArea> storageAreasDomain = new List<StorageArea>();

        foreach (StorageAreaDataModel storageAreaDataModel in storageAreaDataModels)
        {
            StorageArea storageArea = ToDomain(storageAreaDataModel);
            storageAreasDomain.Add(storageArea);
        }
        return storageAreasDomain.AsEnumerable();
    }

    public StorageAreaDataModel ToDataModel(StorageArea storageArea)
    {
        StorageAreaDataModel storageAreaDM = new StorageAreaDataModel(storageArea);
        storageAreaDM.LastModifiedAt = storageArea.LastModifiedAt;
        return storageAreaDM;
    }

    public async Task UpdateDataModelAsync(StorageAreaDataModel storageAreaDM, StorageArea storageArea, DbContext context)
    {
        storageAreaDM.Code = storageArea.Code;
        storageAreaDM.Location = storageArea.Location;
        storageAreaDM.Type = storageArea.Type.ToString();
        storageAreaDM.MaxCapacity = storageArea.MaxCapacity;
        storageAreaDM.CurrentCapacity = storageArea.CurrentCapacity;
        storageAreaDM.LastModifiedAt = storageArea.LastModifiedAt;

        storageAreaDM.StorageAreaDocks!.Clear();

        foreach (var sad in storageArea.StorageAreaDocks!)
        {
            var existingDock = await context.Set<DockDataModel>().FindAsync(sad.Dock.Id);
            if (existingDock != null)
            {
                StorageAreaDockDataModel sadDM = new StorageAreaDockDataModel
                {
                    Dock = existingDock,
                    Distance = sad.Distance
                };
                storageAreaDM.StorageAreaDocks.Add(sadDM);
            }
        }
    }


    
}