namespace Application.Services;

using Domain.Model;
using Application.DTO;

using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using Domain.Factory;

public class RepresentativeService
{
    private readonly IRepresentativeRepository _representativeRepository;
    private readonly IRepresentativeFactory _representativeFactory;

    private readonly IShippingAgentOrganizationRepository _shippingAgentOrganizationRepository;

    public RepresentativeService(IRepresentativeRepository representativeRepository, IRepresentativeFactory representativeFactory, IShippingAgentOrganizationRepository shippingAgentOrganizationRepository)
    {
        _representativeRepository = representativeRepository;
        _representativeFactory = representativeFactory;
        _shippingAgentOrganizationRepository = shippingAgentOrganizationRepository;
    }

    public async Task<IEnumerable<RepresentativeDTO>> GetRepresentativesAsync()
    {
        IEnumerable<Representative> representatives = await _representativeRepository.GetRepresentativesAsync();
        IEnumerable<RepresentativeDTO> representativeDTOs = RepresentativeDTO.ToDTO(representatives);
        return representativeDTOs;
    }

    public async Task<RepresentativeDTO?> GetRepresentativeById(long id)
    {
        Representative? representative = await _representativeRepository.GetRepresentativeByIdAsync(id);
        if (representative != null)
        {
            RepresentativeDTO representativeDTO = RepresentativeDTO.ToDTO(representative);
            return representativeDTO;
        }
        return null;
    }

    public async Task<RepresentativeDTO?> GetRepresentativeByEmail(string email)
    {
        Representative? representative = await _representativeRepository.GetRepresentativeByEmailAsync(email);
        if (representative != null)
        {
            RepresentativeDTO representativeDTO = RepresentativeDTO.ToDTO(representative);
            return representativeDTO;
        }
        return null;
    }

    public async Task<RepresentativeDTO?> GetRepresentativeByPhoneNumber(string phoneNumber)
    {
        Representative? representative = await _representativeRepository.GetRepresentativeByPhoneNumberAsync(phoneNumber);
        if (representative != null)
        {
            RepresentativeDTO representativeDTO = RepresentativeDTO.ToDTO(representative);
            return representativeDTO;
        }
        return null;
    }

    public async Task<RepresentativeDTO?> GetRepresentativeByCitizenId(string citizenId)
    {
        Representative? representative = await _representativeRepository.GetRepresentativeByCitizenIdAsync(citizenId);
        if (representative != null)
        {
            RepresentativeDTO representativeDTO = RepresentativeDTO.ToDTO(representative);
            return representativeDTO;
        }
        return null;
    }

    public async Task<RepresentativeDTO?> GetRepresentativeByName(string name)
    {
        Representative? representative = await _representativeRepository.GetRepresentativeByNameAsync(name);
        if (representative != null)
        {
            RepresentativeDTO representativeDTO = RepresentativeDTO.ToDTO(representative);
            return representativeDTO;
        }
        return null;
    }

    public async Task<RepresentativeDTO?> GetRepresentativeByOrganizationName(string organizationName)
    {
        ShippingAgentOrganization? organization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByLegalNameAsync(organizationName);
        if (organization == null){
            return null;
        }
        Representative? representative = await _representativeRepository.GetRepresentativeByOrganizationAsync(organization);
        if (representative != null)
        {
            RepresentativeDTO representativeDTO = RepresentativeDTO.ToDTO(representative);
            return representativeDTO;
        }
        return null;
    }

    public async Task<RepresentativeDTO?> AddRepresentative(RepresentativeDTO representativeDTO, List<string> errorMessages)
    {
        Representative? representative;
        var representativeOrganization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByLegalNameAsync(representativeDTO.OrganizationName!);
        if (representativeOrganization == null)
        {
            errorMessages.Add($"No Shipping Agent Organization found with the Legal Name '{representativeDTO.OrganizationName}'.");
            return null;
        }

        Representative? representativeByCitizenID = await _representativeRepository.GetRepresentativeByCitizenIdAsync(representativeDTO.CitizenId!);
        if (representativeByCitizenID != null)
        {
            errorMessages.Add($"A vessel Record with the IMO number '{representativeDTO.CitizenId}' already exists.");
            return null;
        }

        Representative? representativeByEmail = await _representativeRepository.GetRepresentativeByEmailAsync(representativeDTO.Email!);
        if (representativeByEmail != null)
        {
            errorMessages.Add($"A vessel Record with the Email '{representativeDTO.Email}' already exists.");
            return null;
        }

        Representative? representativeByPhoneNumber = await _representativeRepository.GetRepresentativeByPhoneNumberAsync(representativeDTO.PhoneNumber!);
        if (representativeByPhoneNumber != null)
        {
            errorMessages.Add($"A vessel Record with the Phone Number '{representativeDTO.PhoneNumber}' already exists.");
            return null;
        }

        try
        {
            representative = _representativeFactory.NewRepresentative(
                representativeOrganization,
                representativeDTO.Name!,
                representativeDTO.CitizenId!,
                representativeDTO.Nationality!,
                representativeDTO.Email!,
                representativeDTO.PhoneNumber!
            );
        }
        catch (ArgumentException ex)
        {
            errorMessages.Add("Error in converting DTO to Domain:" + ex.Message);
            return null;
        }

        Representative addedRepresentative = await _representativeRepository.AddRepresentative(representative);
        RepresentativeDTO addedRepresentativeDTO = RepresentativeDTO.ToDTO(addedRepresentative);
        return addedRepresentativeDTO;
    }


    public async Task<bool> UpdateRepresentative(long id, RepresentativeDTO representativeDTO, List<string> errorMessages)
    {
        Representative? representative = await _representativeRepository.GetRepresentativeByIdAsync(id);
        if (representative == null)
        {
            errorMessages.Add("Representative not found");
            return false;
        }
        Representative? representativeByCitizenID = await _representativeRepository.GetRepresentativeByCitizenIdAsync(representativeDTO.CitizenId!);
        if (representativeByCitizenID != null && representativeByCitizenID.Id != id)
        {
            errorMessages.Add($"A Representative with the Citizen ID '{representativeDTO.CitizenId}' already exists.");
            return false;
        }

        Representative? representativeByEmail = await _representativeRepository.GetRepresentativeByEmailAsync(representativeDTO.Email!);
        if (representativeByEmail != null && representativeByEmail.Id != id)
        {
            errorMessages.Add($"A Representative with the Email '{representativeDTO.Email}' already exists.");
            return false;
        }
        Representative? representativeByPhoneNumber = await _representativeRepository.GetRepresentativeByPhoneNumberAsync(representativeDTO.PhoneNumber!);
        if (representativeByPhoneNumber != null && representativeByPhoneNumber.Id != id)
        {
            errorMessages.Add($"A Representative with the Phone Number '{representativeDTO.PhoneNumber}' already exists.");
            return false;
        }

        var representativeOrganization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByLegalNameAsync(representativeDTO.OrganizationName!);
        if (representativeOrganization == null)
        {
            errorMessages.Add($"No Shipping Agent Organization found with the Legal Name '{representativeDTO.OrganizationName}'.");
            return false;
        }

        try
        {
            representative.ChangeOrganization(representativeOrganization);
            representative.ChangeName(representativeDTO.Name!);
            representative.ChangeNationality(representativeDTO.Nationality!);
            representative.ChangeEmail(representativeDTO.Email!);
            representative.ChangePhoneNumber(representativeDTO.PhoneNumber!);
            await _representativeRepository.Update(representative, errorMessages);
            return true;
        }
        catch (ArgumentException ex)
        {
            errorMessages.Add("Error in updating Representative from DTO: " + ex.Message);
            return false;
        }
    }
}