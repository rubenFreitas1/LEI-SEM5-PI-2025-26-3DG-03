namespace Application.Services;

using Domain.Model;
using Application.DTO;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using Domain.Factory;

public class VesselRecordService
{
    private readonly IVesselRecordRepository _vesselRecordRepository;
    private readonly IVesselTypeRepository _vesselTypeRepository;

    private readonly IVesselRecordFactory _vesselRecordFactory;

    public VesselRecordService(IVesselRecordRepository vesselRecordRepository, IVesselTypeRepository vesselTypeRepository, IVesselRecordFactory vesselRecordFactory)
    {
        _vesselRecordRepository = vesselRecordRepository;
        _vesselTypeRepository = vesselTypeRepository;
        _vesselRecordFactory = vesselRecordFactory;
    }

    public async Task<IEnumerable<VesselRecordDTO>> GetAllVesselRecords()
    {
        IEnumerable<VesselRecord> vesselRecords = await _vesselRecordRepository.GetVesselRecordsAsync();
        IEnumerable<VesselRecordDTO> vesselRecordDTOs = VesselRecordDTO.ToDTO(vesselRecords);
        return vesselRecordDTOs;
    }

    public async Task<VesselRecordDTO?> GetVesselRecordByIMONumber(string imoNumber)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(imoNumber);
        if (vesselRecord != null)
        {
            VesselRecordDTO vesselRecordDTO = VesselRecordDTO.ToDTO(vesselRecord);
            return vesselRecordDTO;
        }
        return null;
    }

    public async Task<VesselRecordDTO?> GetVesselRecordById(long id)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByIdAsync(id);
        if (vesselRecord != null)
        {
            VesselRecordDTO vesselRecordDTO = VesselRecordDTO.ToDTO(vesselRecord);
            return vesselRecordDTO;
        }
        return null;
    }

    public async Task<VesselRecordDTO?> GetVesselRecordByVesselName(string name)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByVesselNameAsync(name);
        if (vesselRecord != null)
        {
            VesselRecordDTO vesselRecordDTO = VesselRecordDTO.ToDTO(vesselRecord);
            return vesselRecordDTO;
        }
        return null;
    }

    public async Task<VesselRecordDTO?> GetVesselRecordByOperator(string operatorName)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByOperatorAsync(operatorName);
        if (vesselRecord != null)
        {
            VesselRecordDTO vesselRecordDTO = VesselRecordDTO.ToDTO(vesselRecord);
            return vesselRecordDTO;
        }
        return null;
    }


    public async Task<VesselRecordDTO?> AddVesselRecord(VesselRecordDTO vesselRecordDTO, List<string> errorMessages)
    {
        VesselRecord? vesselRecord;
        VesselRecord? vesselRecordByIMO = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(vesselRecordDTO.IMONumber!);
        if (vesselRecordByIMO != null)
        {
            errorMessages.Add($"A vessel Record with the IMO number '{vesselRecordDTO.IMONumber}' already exists.");
            return null;
        }

        var vesselType = await _vesselTypeRepository.GetVesselTypeByNameAsync(vesselRecordDTO.VesselTypeName!);

        if (vesselType == null)
        {
            errorMessages.Add($"Vessel type '{vesselRecordDTO.VesselTypeName}' does not exist.");
            return null;
        }
        try
        {
            vesselRecord = _vesselRecordFactory.NewVesselRecord(
                vesselRecordDTO.IMONumber!,
                vesselRecordDTO.VesselName!,
                vesselType,
                vesselRecordDTO.Operator!
            );
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return null;
        }

        VesselRecord vesselRecordSaved = await _vesselRecordRepository.AddVesselRecord(vesselRecord);
        VesselRecordDTO vrDTO = VesselRecordDTO.ToDTO(vesselRecordSaved);
        return vrDTO;
    }


    public async Task<bool> UpdateVesselRecord(string imoNumber, VesselRecordDTO vesselRecordDTO, List<string> errorMessages)
    {
        VesselRecord? vesselRecord = await _vesselRecordRepository.GetVesselRecordByImoNumberAsync(imoNumber);
        if (imoNumber != vesselRecordDTO.IMONumber)
        {
            errorMessages.Add("IMO number is not updatable");
            return false;
        }
        if (vesselRecord == null)
        {
            errorMessages.Add($"Vessel Record with IMO number '{imoNumber}' not found.");
            return false;
        }

        var vesselType = await _vesselTypeRepository.GetVesselTypeByNameAsync(vesselRecordDTO.VesselTypeName!);
        if (vesselType == null)
        {
            errorMessages.Add($"Vessel type '{vesselRecordDTO.VesselTypeName}' does not exist.");
            return false;
        }

        try
        {
            vesselRecord.ChangeVesselName(vesselRecordDTO.VesselName!);
            vesselRecord.ChangeVesselType(vesselType);
            vesselRecord.ChangeOperator(vesselRecordDTO.Operator!);
            await _vesselRecordRepository.Update(vesselRecord, errorMessages);
            return true;
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in updating Vessel Record: " + ex.Message);
            return false;
        }

    }
}