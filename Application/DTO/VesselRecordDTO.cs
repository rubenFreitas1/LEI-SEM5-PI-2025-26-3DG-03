namespace Application.DTO;

using Domain.Model;

public class VesselRecordDTO
{

    public long Id { get; set; }
    public string? IMONumber { get; set; }

    public string? VesselName { get; set; }

    public string? VesselTypeName { get; set; }

    public string? Operator { get; set; }

    public VesselRecordDTO() { }

    public VesselRecordDTO(string imoNumber, string vesselName, string vesselTypeName, string operatorName)
    {
        IMONumber = imoNumber;
        VesselName = vesselName;
        Operator = operatorName;
        VesselTypeName = vesselTypeName;
    }

    static public VesselRecordDTO ToDTO(VesselRecord vesselRecord)
    {
        try
        {
            VesselRecordDTO vesselRecordDTO = new VesselRecordDTO(vesselRecord.IMONumber!, vesselRecord.VesselName!, vesselRecord.VesselType!.Name!, vesselRecord.Operator!);
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

}