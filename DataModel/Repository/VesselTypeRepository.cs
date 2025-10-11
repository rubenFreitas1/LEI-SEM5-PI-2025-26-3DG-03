namespace DataModel.Repository;

using System.Runtime.Serialization.Formatters;
using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Domain.Model;

public class VesselTypeRepository : GenericRepository<VesselType>, IVesselTypeRepository
{
    VesselTypeMapper _vtMapper;

    public VesselTypeRepository(ShippingManagementContext context, VesselTypeMapper mapper) : base(context!)
    {
        _vtMapper = mapper;
    }

    public async Task<IEnumerable<VesselType>> GetVesselTypesAsync()
    {
        try
        {
            IEnumerable<VesselTypeDataModel> vesselTypeDataModels = await _context.Set<VesselTypeDataModel>()
                    .ToListAsync();
            IEnumerable<VesselType> vesselTypes = _vtMapper.ToDomain(vesselTypeDataModels);
            return vesselTypes;
        }
        catch
        {
            throw;
        }
    }

    public async Task<VesselType?> GetVesselTypeByNameAsync(string name)
    {
        try
        {
            VesselTypeDataModel? vesselTypeDM = await _context.Set<VesselTypeDataModel>()
            .SingleOrDefaultAsync(v => v.Name == name);
            if (vesselTypeDM != null)
            {
                VesselType vesselType = _vtMapper.ToDomain(vesselTypeDM);
                return vesselType;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }


    public async Task<VesselType?> GetVesselTypeByIdAsync(long id)
    {
        try
        {
            VesselTypeDataModel? vesselTypeDM = await _context.Set<VesselTypeDataModel>()
            .SingleOrDefaultAsync(v => v.Id == id);
            if (vesselTypeDM != null)
            {
                VesselType vesselType = _vtMapper.ToDomain(vesselTypeDM);
                return vesselType;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<IEnumerable<VesselType?>> GetVesselTypeByDescriptionAsync(string description)
    {
        try
        {
            IEnumerable<VesselTypeDataModel> vesselTypeDataModels = await _context.Set<VesselTypeDataModel>()
                    .Where(v => v.Description == description).ToListAsync();
            IEnumerable<VesselType> vesselTypes = _vtMapper.ToDomain(vesselTypeDataModels);
            return vesselTypes;
        }
        catch
        {
            throw;
        }
    }


    public async Task<VesselType> AddVesselType(VesselType vesselType)
    {
        try
        {
            VesselTypeDataModel vesselTypeDM = _vtMapper.ToDataModel(vesselType);
            EntityEntry<VesselTypeDataModel> vesselTypeDM_EE = _context.Set<VesselTypeDataModel>().Add(vesselTypeDM);
            await _context.SaveChangesAsync();
            VesselTypeDataModel vesselTypeDataModelSaved = vesselTypeDM_EE.Entity;
            VesselType vesselTypeSaved = _vtMapper.ToDomain(vesselTypeDataModelSaved);
            return vesselTypeSaved;
        }
        catch
        {
            throw;
        }
    }

    public async Task<VesselType?> Update(VesselType vesselType, List<string> errorMessages)
    {
        try
        {
            var vesselTypeDataModel = await _context.Set<VesselTypeDataModel>()
            .FirstOrDefaultAsync(v => v.Id == vesselType.Id);

            if (vesselTypeDataModel == null)
            {
                errorMessages.Add("Vessel Type not found!");
                return null;
            }
            _vtMapper.UpdateDataModel(vesselTypeDataModel, vesselType);
            await _context.SaveChangesAsync();
            return _vtMapper.ToDomain(vesselTypeDataModel);
        }
        catch (DbUpdateConcurrencyException)
        {
            errorMessages.Add("Concurrency error occurred while updating Vessel Type.");
            throw;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"Unexpected error: {ex.Message}");
            throw;
        }
    }


    public async Task<bool> VesselTypeExists(long id)
    {
        return await _context.Set<VesselTypeDataModel>().AnyAsync(v => v.Id == id);
    }

}