namespace Domain.Factory;

using Domain.Model;

public interface IVesselRecordFactory
{
    VesselRecord NewVesselRecord(string imoNumber, string name, VesselType vesselType, string operatorName);
}