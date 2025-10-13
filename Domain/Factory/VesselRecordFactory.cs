namespace Domain.Factory;

using Domain.Model;

public class VesselRecordFactory : IVesselRecordFactory
{
    public VesselRecord NewVesselRecord(string imoNumber, string name, VesselType vesselType, string operatorName)
    {
        return new VesselRecord(imoNumber, name, vesselType, operatorName);
    }
}