namespace DataModel.Mapper;

using DataModel.Model;
using Domain.Factory;
using Domain.Model;

public class VesselTypeMapper
{
    private IVesselTypeFactory _vesselTypeFactory;

    public VesselTypeMapper(IVesselTypeFactory vesselTypeFactory)
    {
        _vesselTypeFactory = vesselTypeFactory;
    }

    public VesselType ToDomain(VesselTypeDataModel vesselTypeDM)
    {
        VesselType vesselTypeDomain = _vesselTypeFactory.NewVesselType(vesselTypeDM.Name!, vesselTypeDM.Description!, vesselTypeDM.Capacity, vesselTypeDM.MaxRows, vesselTypeDM.MaxBays, vesselTypeDM.MaxTiers);
        vesselTypeDomain.Id = vesselTypeDM.Id;
        return vesselTypeDomain;
    }

    public IEnumerable<VesselType> ToDomain(IEnumerable<VesselTypeDataModel> vesselTypeDataModels)
    {
        List<VesselType> vesselTypesDomain = new List<VesselType>();

        foreach (VesselTypeDataModel vesselTypeDataModel in vesselTypeDataModels)
        {
            VesselType vesselType = ToDomain(vesselTypeDataModel);
            vesselTypesDomain.Add(vesselType);
        }
        return vesselTypesDomain.AsEnumerable();
    }

    public VesselTypeDataModel ToDataModel(VesselType vesselType)
    {
        VesselTypeDataModel vesselTypeDataModel = new VesselTypeDataModel(vesselType);
        return vesselTypeDataModel;
    }

    public void UpdateDataModel(VesselTypeDataModel vesselTypeDM, VesselType vesselType)
    {
        vesselTypeDM.Name = vesselType.Name;
        vesselTypeDM.Description = vesselType.Description;
        vesselTypeDM.Capacity = vesselType.Capacity;
        vesselTypeDM.MaxRows = vesselType.MaxRows;
        vesselTypeDM.MaxBays = vesselType.MaxBays;
        vesselTypeDM.MaxTiers = vesselType.MaxTiers;
    }




}