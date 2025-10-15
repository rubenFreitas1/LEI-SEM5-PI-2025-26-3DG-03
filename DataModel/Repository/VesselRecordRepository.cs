namespace DataModel.Repository;

using DataModel.Mapper;
using DataModel.Model;
using Domain.IRepository;
using Microsoft.EntityFrameworkCore;
using Domain.Model;
using Microsoft.EntityFrameworkCore.ChangeTracking;

public class VesselRecordRepository : GenericRepository<VesselRecord>, IVesselRecordRepository
{
    VesselRecordMapper _vrMapper;

    public VesselRecordRepository(ShippingManagementContext context, VesselRecordMapper mapper) : base(context!)
    {
        _vrMapper = mapper;
    }

    public async Task<IEnumerable<VesselRecord>> GetVesselRecordsAsync()
    {
        try
        {
            IEnumerable<VesselRecordDataModel> vesselRecordDataModels = await _context.Set<VesselRecordDataModel>()
                .Include(v => v.VesselType)
                    .ToListAsync();
            IEnumerable<VesselRecord> vesselRecords = _vrMapper.ToDomain(vesselRecordDataModels);
            return vesselRecords;
        }
        catch
        {
            throw;
        }
    }

    public async Task<VesselRecord?> GetVesselRecordByImoNumberAsync(string imoNumber)
    {
        try
        {
            VesselRecordDataModel? vesselRecordDM = await _context.Set<VesselRecordDataModel>()
            .Include(v => v.VesselType)
            .SingleOrDefaultAsync(v => v.IMONumber == imoNumber);
            if (vesselRecordDM != null)
            {
                VesselRecord vesselRecord = _vrMapper.ToDomain(vesselRecordDM);
                return vesselRecord;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }

    }

    public async Task<VesselRecord?> GetVesselRecordByIdAsync(long id)
    {
        try
        {
            VesselRecordDataModel? vesselRecordDM = await _context.Set<VesselRecordDataModel>()
            .Include(v => v.VesselType)
            .SingleOrDefaultAsync(v => v.Id == id);
            if (vesselRecordDM != null)
            {
                VesselRecord vesselRecord = _vrMapper.ToDomain(vesselRecordDM);
                return vesselRecord;
            }
            return null;
        }
        catch
        {
            return null; throw;
        }
    }

    public async Task<VesselRecord?> GetVesselRecordByVesselNameAsync(string name)
    {
        VesselRecordDataModel? vesselRecordDM = await _context.Set<VesselRecordDataModel>()
            .Include(v => v.VesselType)
            .SingleOrDefaultAsync(v => v.VesselName == name);


        if (vesselRecordDM == null)
            return null;

        return _vrMapper.ToDomain(vesselRecordDM);
    }

    public async Task<VesselRecord?> GetVesselRecordByOperatorAsync(string operatorName)
    {
        try
        {
            VesselRecordDataModel? vesselRecordDM = await _context.Set<VesselRecordDataModel>()
            .Include(v => v.VesselType)
            .SingleOrDefaultAsync(v => v.Operator == operatorName);
            if (vesselRecordDM != null)
            {
                VesselRecord vesselRecord = _vrMapper.ToDomain(vesselRecordDM);
                return vesselRecord;
            }
            return null;
        }
        catch
        {
            throw;
        }
    }

    public async Task<VesselRecord> AddVesselRecord(VesselRecord vesselRecord)
    {
        try
        {
            VesselRecordDataModel vesselRecordDM = _vrMapper.ToDataModel(vesselRecord);
            var vesselType = await _context.Set<VesselTypeDataModel>().Where(vt => vt.Id == vesselRecord.VesselType!.Id).FirstOrDefaultAsync();
            vesselRecordDM.VesselType = vesselType;
            EntityEntry<VesselRecordDataModel> vesselRecordDM_EE = _context.Set<VesselRecordDataModel>().Add(vesselRecordDM);
            await _context.SaveChangesAsync();
            VesselRecordDataModel VesselRecordDataModelSaved = vesselRecordDM_EE.Entity;
            VesselRecord vesselRecordSaved = _vrMapper.ToDomain(VesselRecordDataModelSaved);
            return vesselRecordSaved;
        }
        catch
        {
            throw;
        }
    }

    public async Task<VesselRecord?> Update(VesselRecord vesselRecord, List<string> errorMessages)
    {
        try
        {
            var vesselRecordDataModel = await _context.Set<VesselRecordDataModel>()
                .Include(v => v.VesselType)
                .FirstOrDefaultAsync(v => v.Id == vesselRecord.Id);

            if (vesselRecordDataModel == null)
            {
                errorMessages.Add("Vessel Record not found!");
                return null;
            }

            await _vrMapper.UpdateDataModelAsync(vesselRecordDataModel, vesselRecord, _context);
            await _context.SaveChangesAsync();
            return _vrMapper.ToDomain(vesselRecordDataModel);
        }
        catch (DbUpdateConcurrencyException)
        {
            errorMessages.Add("Concurrency error occurred while updating the Vessel Record.");
            return null;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"An error occurred: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> VesselRecordExists(long id)
    {
        return await _context.Set<VesselRecordDataModel>().AnyAsync(v => v.Id == id);
    }
}





