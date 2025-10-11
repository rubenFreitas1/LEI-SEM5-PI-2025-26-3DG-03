namespace Application.Services;

using Domain.Model;
using Application.DTO;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using ShippingManagement.Domain.Vessels;

public class VesselTypeService
{

    private readonly IVesselTypeRepository _vesselTypeRepository;

    public VesselTypeService(IVesselTypeRepository vesselTypeRepository)
    {
        _vesselTypeRepository = vesselTypeRepository;
    }

    public async Task<IEnumerable<VesselTypeDTO>> GetAllVesselTypes()
    {
        IEnumerable<VesselType> vesselTypes = await _vesselTypeRepository.GetVesselTypesAsync();
        IEnumerable<VesselTypeDTO> vesselTypeDTOs = VesselTypeDTO.ToDTO(vesselTypes);
        return vesselTypeDTOs;
    }

    public async Task<VesselTypeDTO?> GetVesselTypeByName(string name)
    {
        VesselType? vesselType = await _vesselTypeRepository.GetVesselTypeByNameAsync(name);
        if (vesselType != null)
        {
            VesselTypeDTO vesselTypeDTO = VesselTypeDTO.ToDTO(vesselType);
            return vesselTypeDTO;
        }
        return null;
    }

    public async Task<VesselTypeDTO?> GetVesselTypeByID(long id)
    {
        VesselType? vesselType = await _vesselTypeRepository.GetVesselTypeByIdAsync(id);
        if (vesselType != null)
        {
            VesselTypeDTO vesselTypeDTO = VesselTypeDTO.ToDTO(vesselType);
            return vesselTypeDTO;
        }
        return null;
    }

    public async Task<IEnumerable<VesselTypeDTO?>> GetVesselTypeByDescription(string description)
    {
        IEnumerable<VesselType?> vesselTypes = await _vesselTypeRepository.GetVesselTypeByDescriptionAsync(description);
        if (vesselTypes != null)
        {
            var nonNullVesselTypes = vesselTypes.Where(v => v != null)!;
            IEnumerable<VesselTypeDTO> vesselTypeDTO = VesselTypeDTO.ToDTO(nonNullVesselTypes.Cast<VesselType>());
            return vesselTypeDTO;
        }
        return Enumerable.Empty<VesselTypeDTO>();
    }

    public async Task<VesselTypeDTO?> AddVesselType(VesselTypeDTO vesselTypeDTO, List<string> errorMessages)
    {

        VesselType? vesselType = await _vesselTypeRepository.GetVesselTypeByNameAsync(vesselTypeDTO.Name!);
        if (vesselType != null)
        {
            errorMessages.Add("Vessel Type Already Exists!");
            return null;
        }
        try
        {
            vesselType = VesselTypeDTO.ToDomain(vesselTypeDTO);
        }
        catch (Exception ex)
        {
            errorMessages.Add("Error in converting DTO to Domain: " + ex.Message);
            return null;
        }

        VesselType vesselTypeSaved = await _vesselTypeRepository.AddVesselType(vesselType);
        VesselTypeDTO vDTO = VesselTypeDTO.ToDTO(vesselTypeSaved);
        return vDTO;
    }

    public async Task<bool> UpdateVesselType(string name, VesselTypeDTO vesselTypeDTO, List<string> errorMessages)
    {
        VesselType? vesselType = await _vesselTypeRepository.GetVesselTypeByNameAsync(name);
        try
        {
            
            if (vesselType != null)
            {
                VesselTypeDTO.UpdateToDomain(vesselType, vesselTypeDTO);
                await _vesselTypeRepository.Update(vesselType, errorMessages);
                return true;
            }
            else
            {
                errorMessages.Add("Vessel Type not found");
                return false;
            }
        }catch(Exception ex)
        {
            errorMessages.Add("Error in updating Vessel Type: " + ex.Message);
            return false;
        }
        
    }


}