namespace Domain.Factory;

using Domain.Model;

public interface IVesselRecordFactory
{
    VesselRecord NewVesselRecord(int imoNumber, string name, VesselType vesselType, string operatorName);
}