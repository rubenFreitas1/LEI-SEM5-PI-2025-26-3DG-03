namespace Application.DTO;

using Domain.Model;
using ShippingManagement.Domain.Vessels;

public class VesselRecordDTO
{

    public int IMONumber { get; private set; }

    public string? VesselName { get; private set; }

    public VesselType? VesselType { get; private set; }

    public string? Operator { get; private set; }

    public VesselRecordDTO() { }

    public VesselRecordDTO(int imoNumber, string vesselName, VesselType vesselType, string operatorName)
    {
        IMONumber = imoNumber;
        VesselName = vesselName;
        VesselType = vesselType;
        Operator = operatorName;
    }

    static public VesselRecordDTO ToDTO(VesselRecord vesselRecord)
    {
        try
        {
            VesselRecordDTO vesselRecordDTO = new VesselRecordDTO(vesselRecord.IMONumber, vesselRecord.VesselName!, vesselRecord.VesselType!, vesselRecord.Operator!);
            return vesselRecordDTO;
        }
        catch (ArgumentOutOfRangeException ex)
        {
            throw new ArgumentException($"Error converting to VesselRecordDTO: {ex.Message}");
        }
    }

    static public IEnumerable<VesselRecordDTO> ToDTO(IEnumerable<VesselRecord> vesselRecords)
    {
        List<VesselRecordDTO> vesselRecordDTOs = new List<VesselRecordDTO>();
        foreach (VesselRecord vesselRecord in vesselRecords)
        {
            VesselRecordDTO vesselRecordDTO = ToDTO(vesselRecord);
            vesselRecordDTOs.Add(vesselRecordDTO);
        }
        return vesselRecordDTOs;
    }

    static public VesselRecord ToDomain(VesselRecordDTO vesselRecordDTO)
    {
        if (vesselRecordDTO.VesselName is null)
            throw new InvalidOperationException("VesselRecord.VesselName cannot be null");

        if (vesselRecordDTO.VesselType is null)
            throw new InvalidOperationException("VesselRecord.VesselType cannot be null");

        if (vesselRecordDTO.Operator is null)
            throw new InvalidOperationException("VesselRecord.Operator cannot be null");

        if (vesselRecordDTO.IMONumber >= 1000000 && vesselRecordDTO.IMONumber <= 9999999)
            throw new ArgumentOutOfRangeException("IMONumber must have 7 digits.");

        VesselRecord vesselRecord = new VesselRecord(vesselRecordDTO.IMONumber, vesselRecordDTO.VesselName, vesselRecordDTO.VesselType, vesselRecordDTO.Operator);
        return vesselRecord;
    }

    static public VesselRecord UpdateToDomain(VesselRecord vesselRecord, VesselRecordDTO vesselRecordDTO)
    {
        vesselRecord.ChangeIMONumber(vesselRecordDTO.IMONumber);
        vesselRecord.ChangeVesselName(vesselRecordDTO.VesselName!);
        vesselRecord.ChangeVesselType(vesselRecordDTO.VesselType!);
        vesselRecord.ChangeOperator(vesselRecordDTO.Operator!);
        return vesselRecord;
    }

}