namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Factory;
using Domain.Model;
using Microsoft.EntityFrameworkCore;

public class VesselRecordMapper
{
    private IVesselRecordFactory _vesselRecordFactory;
    private VesselTypeMapper _vesselTypeMapper;

    public VesselRecordMapper(IVesselRecordFactory vesselRecordFactory, VesselTypeMapper vesselTypeMapper)
    {
        _vesselRecordFactory = vesselRecordFactory;
        _vesselTypeMapper = vesselTypeMapper;
    }

    public VesselRecord ToDomain(VesselRecordDataModel vesselRecordDM)
    {
        VesselType? vesselType = null;
        if (vesselRecordDM.VesselType != null)
            vesselType = _vesselTypeMapper.ToDomain(vesselRecordDM.VesselType);

        VesselRecord vesselRecordDomain = _vesselRecordFactory.NewVesselRecord(vesselRecordDM.IMONumber!, vesselRecordDM.VesselName!, vesselType!, vesselRecordDM.Operator!);
        vesselRecordDomain.Id = vesselRecordDM.Id;
        vesselRecordDomain.LastModifiedAt = vesselRecordDM.LastModifiedAt;
        return vesselRecordDomain;
    }

    public IEnumerable<VesselRecord> ToDomain(IEnumerable<VesselRecordDataModel> vesselRecordDataModels)
    {
        List<VesselRecord> vesselRecordsDomain = new List<VesselRecord>();

        foreach (VesselRecordDataModel vesselRecordDataModel in vesselRecordDataModels)
        {
            VesselRecord vesselRecord = ToDomain(vesselRecordDataModel);
            vesselRecordsDomain.Add(vesselRecord);
        }
        return vesselRecordsDomain.AsEnumerable();
    }

    public VesselRecordDataModel ToDataModel(VesselRecord vesselRecord)
    {
        VesselRecordDataModel vesselRecordDataModel = new VesselRecordDataModel(vesselRecord);
        vesselRecordDataModel.LastModifiedAt = vesselRecord.LastModifiedAt;
        return vesselRecordDataModel;
    }

    public async Task UpdateDataModelAsync(VesselRecordDataModel vesselRecordDM, VesselRecord vesselRecord, DbContext context)
    {
        vesselRecordDM.VesselName = vesselRecord.VesselName;
        var existingVesselType = await context.Set<VesselTypeDataModel>().FindAsync(vesselRecord.VesselType!.Id);
        if (existingVesselType != null)
        {
            vesselRecordDM.VesselType = existingVesselType;
        }
        vesselRecordDM.Operator = vesselRecord.Operator;
        vesselRecordDM.LastModifiedAt = vesselRecord.LastModifiedAt;
    }
}

