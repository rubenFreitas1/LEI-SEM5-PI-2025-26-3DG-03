namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.Model;
using System.Collections.Generic;

public class StorageAreaRepository : GenericRepository<StorageArea>, IStorageAreaRepository
{
    private readonly StorageAreaMapper _storageAreaMapper;

    public StorageAreaRepository(ShippingManagementContext context, StorageAreaMapper mapper) : base(context!)
    {
        _storageAreaMapper = mapper;
    }

    public async Task<IEnumerable<StorageArea>> GetStorageAreasAsync()
    {
        try
        {
            IEnumerable<StorageAreaDataModel> storageAreaDataModels = await _context.Set<StorageAreaDataModel>()
                .Include(sa => sa.StorageAreaDocks)!
                    .ThenInclude(sad => sad.Dock)!
                .ToListAsync();
            IEnumerable<StorageArea> storageAreas = _storageAreaMapper.ToDomain(storageAreaDataModels);
            return storageAreas;
        }
        catch
        {
            throw;
        }
    }



    public async Task<StorageArea?> GetStorageAreaByCodeAsync(string code)
    {
        try
        {
            StorageAreaDataModel? storageAreaDataModel = await _context.Set<StorageAreaDataModel>()
                .Include(sa => sa.StorageAreaDocks)!
                    .ThenInclude(sad => sad.Dock)!
                .FirstOrDefaultAsync(sa => sa.Code == code);

            if (storageAreaDataModel == null)
            {
                return null;
            }

            StorageArea storageArea = _storageAreaMapper.ToDomain(storageAreaDataModel);
            return storageArea;
        }
        catch
        {
            throw;
        }
    }

    public async Task<StorageArea?> GetStorageAreaByIdAsync(long id)
    {
        try
        {
            StorageAreaDataModel? storageAreaDataModel = await _context.Set<StorageAreaDataModel>()
                .Include(sa => sa.StorageAreaDocks)!
                    .ThenInclude(sad => sad.Dock)!
                .FirstOrDefaultAsync(sa => sa.Id == id);

            if (storageAreaDataModel == null)
            {
                return null;
            }
            StorageArea storageArea = _storageAreaMapper.ToDomain(storageAreaDataModel);
            return storageArea;
        }
        catch
        {
            throw;
        }
    }

    public async Task<StorageArea?> GetStorageAreaByLocationAsync(string location)
    {
        try
        {
            StorageAreaDataModel? storageAreaDataModel = await _context.Set<StorageAreaDataModel>()
                .Include(sa => sa.StorageAreaDocks)!
                    .ThenInclude(sad => sad.Dock)!
                .FirstOrDefaultAsync(sa => sa.Location == location);

            if (storageAreaDataModel == null)
            {
                return null;
            }
            StorageArea storageArea = _storageAreaMapper.ToDomain(storageAreaDataModel);
            return storageArea;
        }
        catch
        {
            throw;
        }
    }


    public async Task<StorageArea> AddStorageArea(StorageArea storageArea)
    {
        try
        {
            StorageAreaDataModel storageAreaDM = _storageAreaMapper.ToDataModel(storageArea);
            if (storageAreaDM.StorageAreaDocks != null && storageArea.StorageAreaDocks != null)
            {
                var newSadList = new List<StorageAreaDockDataModel>();
                foreach (var sad in storageArea.StorageAreaDocks)
                {
                    var existingDock = await _context.Set<DockDataModel>().FindAsync(sad.Dock.Id);
                    if (existingDock != null)
                    {
                        var sadDM = new StorageAreaDockDataModel
                        {
                            Dock = existingDock,
                            Distance = sad.Distance
                        };
                        newSadList.Add(sadDM);
                    }
                    else
                    {
                        throw new InvalidOperationException($"Dock with id {sad.Dock.Id} not found when creating storage area.");
                    }
                }
                storageAreaDM.StorageAreaDocks = newSadList;
            }

            EntityEntry<StorageAreaDataModel> addedEntry = _context.Set<StorageAreaDataModel>().Add(storageAreaDM);
            await _context.SaveChangesAsync();
            StorageArea addedStorageArea = _storageAreaMapper.ToDomain(addedEntry.Entity);
            return addedStorageArea;
        }
        catch
        {
            throw;
        }
    }

    public async Task<bool> Update(StorageArea storageArea, List<string> errorMessages)
    {
        try
        {
            StorageAreaDataModel? storageAreaDM = await _context.Set<StorageAreaDataModel>()
                .Include(sa => sa.StorageAreaDocks)!
                    .ThenInclude(sad => sad.Dock)!
                .FirstOrDefaultAsync(sa => sa.Id == storageArea.Id);

            if (storageAreaDM == null)
            {
                errorMessages.Add($"StorageArea with Id {storageArea.Id} not found.");
                return false;
            }

            await _storageAreaMapper.UpdateDataModelAsync(storageAreaDM, storageArea, _context);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"An error occurred while updating the StorageArea: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> StorageAreaExists(long id)
    {
        return await _context.Set<StorageAreaDataModel>().AnyAsync(sa => sa.Id == id);
    }
}

