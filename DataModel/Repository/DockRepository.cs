namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.Model;




public class DockRepository : GenericRepository<Dock>, IDockRepository
{
    DockMapper _dockMapper;

    public DockRepository(ShippingManagementContext context, DockMapper mapper) : base(context!)
    {
        _dockMapper = mapper;
    }

    public async Task<IEnumerable<Dock>> GetDocksAsync()
    {
        try
        {
            IEnumerable<DockDataModel> dockDataModels = await _context.Set<DockDataModel>()
            .Include(d => d.VesselTypesAllowed)
                    .ToListAsync();
            IEnumerable<Dock> docks = _dockMapper.ToDomain(dockDataModels);
            return docks;
        }
        catch
        {
            throw;
        }
    }

    public async Task<Dock?> GetDockByNameAsync(string name)
    {
        try
        {
            DockDataModel? dockDM = await _context.Set<DockDataModel>()
            .Include(d => d.VesselTypesAllowed)
            .SingleOrDefaultAsync(d => d.Name == name);
            if (dockDM != null)
            {
                Dock dock = _dockMapper.ToDomain(dockDM);
                return dock;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }


    public async Task<Dock?> GetDockByIdAsync(long id)
    {
        try
        {
            DockDataModel? dockDM = await _context.Set<DockDataModel>()
            .Include(d => d.VesselTypesAllowed)
            .SingleOrDefaultAsync(d => d.Id == id);
            if (dockDM != null)
            {
                Dock dock = _dockMapper.ToDomain(dockDM);
                return dock;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<Dock?> GetDockByLocationAsync(string location)
    {
        try
        {
            DockDataModel? dockDM = await _context.Set<DockDataModel>()
            .Include(d => d.VesselTypesAllowed)
            .SingleOrDefaultAsync(d => d.Location == location);
            if (dockDM != null)
            {
                Dock dock = _dockMapper.ToDomain(dockDM);
                return dock;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<IEnumerable<Dock?>> GetDocksByVesselTypesAsync(IEnumerable<VesselType> vesselTypes)
    {
        var vesselTypeNames = vesselTypes.Select(vt => vt.Name).Where(n => n != null).ToList();

        if (!vesselTypeNames.Any())
            return Enumerable.Empty<Dock>();

        var dockDataModels = await _context.Set<DockDataModel>()
            .Include(d => d.VesselTypesAllowed)
            .ToListAsync();

        var filtered = dockDataModels
        .Where(d => vesselTypeNames.All(vtName => d.VesselTypesAllowed!.Any(vt => vt.Name == vtName)))
        .ToList();

        var docks = _dockMapper.ToDomain(filtered);
        return docks;
    }

    public async Task<Dock> AddDock(Dock dock)
    {
        try
        {
            DockDataModel dockDM = _dockMapper.ToDataModel(dock);
            var vesselTypeIds = dock.VesselTypesAllowed!.Select(vt => vt.Id).ToList();
            var vesselTypesFromDb = await _context.Set<VesselTypeDataModel>()
            .Where(vt => vesselTypeIds.Contains(vt.Id))
            .ToListAsync();
            dockDM.VesselTypesAllowed = vesselTypesFromDb;
            EntityEntry<DockDataModel> addedEntry = _context.Set<DockDataModel>().Add(dockDM);
            await _context.SaveChangesAsync();
            DockDataModel dockDataModel = addedEntry.Entity;
            Dock addedDock = _dockMapper.ToDomain(dockDataModel);
            return addedDock;
        }
        catch
        {
            throw;
        }
    }


    public async Task<Dock?> Update(Dock dock, List<string> errorMessages)
    {
        try
        {
            DockDataModel? dockDM = await _context.Set<DockDataModel>()
                .Include(d => d.VesselTypesAllowed)
                .SingleOrDefaultAsync(d => d.Id == dock.Id);

            if (dockDM == null)
            {
                errorMessages.Add($"Dock with ID {dock.Id} not found.");
                return null;
            }

            await _dockMapper.UpdateDataModelAsync(dockDM, dock, _context);

            await _context.SaveChangesAsync();

            return _dockMapper.ToDomain(dockDM);
        }
        catch (Exception ex)
        {
            errorMessages.Add($"An error occurred while updating the dock: {ex.Message}");
            return null;
        }
    }


    public async Task<bool> DockExists(long id)
    {
        return await _context.Set<DockDataModel>().AnyAsync(d => d.Id == id);
    }
}