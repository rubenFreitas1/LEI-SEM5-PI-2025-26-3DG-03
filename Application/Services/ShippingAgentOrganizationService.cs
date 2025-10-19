namespace Application.Services;

using Domain.Model;
using Application.DTO;

using Microsoft.EntityFrameworkCore;
using Domain.IRepository;
using DataModel.Repository;

public class ShippingAgentOrganizationService
{
    private readonly IShippingAgentOrganizationRepository _shippingAgentOrganizationRepository;
    private readonly RepresentativeService _representativeService;
    private readonly ShippingManagementContext _context;

    public ShippingAgentOrganizationService(
        IShippingAgentOrganizationRepository shippingAgentOrganizationRepository,
        RepresentativeService representativeService,
        ShippingManagementContext context)
    {
        _shippingAgentOrganizationRepository = shippingAgentOrganizationRepository;
        _representativeService = representativeService;
        _context = context;
    }

    public async Task<IEnumerable<ShippingAgentOrganizationDTO>> GetAllShippingAgentOrganizations()
    {
        IEnumerable<ShippingAgentOrganization> organizations = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationsAsync();
        IEnumerable<ShippingAgentOrganizationDTO> organizationDTOs = ShippingAgentOrganizationDTO.ToDTO(organizations);
        return organizationDTOs;
    }

    public async Task<ShippingAgentOrganizationDTO?> GetShippingAgentOrganizationByCode(string code)
    {
        ShippingAgentOrganization? organization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByCodeAsync(code);
        if (organization != null)
        {
            ShippingAgentOrganizationDTO organizationDTO = ShippingAgentOrganizationDTO.ToDTO(organization);
            return organizationDTO;
        }
        return null;
    }

    public async Task<ShippingAgentOrganizationDTO?> GetShippingAgentOrganizationById(long id)
    {
        ShippingAgentOrganization? organization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByIdAsync(id);
        if (organization != null)
        {
            ShippingAgentOrganizationDTO organizationDTO = ShippingAgentOrganizationDTO.ToDTO(organization);
            return organizationDTO;
        }
        return null;
    }

    public async Task<ShippingAgentOrganizationDTO?> GetShippingAgentOrganizationByLegalName(string legalName)
    {
        ShippingAgentOrganization? organization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByLegalNameAsync(legalName);
        if (organization != null)
        {
            ShippingAgentOrganizationDTO organizationDTO = ShippingAgentOrganizationDTO.ToDTO(organization);
            return organizationDTO;
        }
        return null;
    }

    public async Task<ShippingAgentOrganizationDTO?> GetShippingAgentOrganizationByAlternativeName(string alternativeName)
    {
        ShippingAgentOrganization? organization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByAlternativeNameAsync(alternativeName);
        if (organization != null)
        {
            ShippingAgentOrganizationDTO organizationDTO = ShippingAgentOrganizationDTO.ToDTO(organization);
            return organizationDTO;
        }
        return null;
    }

    public async Task<ShippingAgentOrganizationDTO?> GetShippingAgentOrganizationByTaxNumber(string taxNumber)
    {
        ShippingAgentOrganization? organization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByTaxNumberAsync(taxNumber);
        if (organization != null)
        {
            ShippingAgentOrganizationDTO organizationDTO = ShippingAgentOrganizationDTO.ToDTO(organization);
            return organizationDTO;
        }
        return null;
    }

    public async Task<ShippingAgentOrganizationDTO?> GetShippingAgentOrganizationByAddress(string address)
    {
        ShippingAgentOrganization? organization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByAddressAsync(address);
        if (organization != null)
        {
            ShippingAgentOrganizationDTO organizationDTO = ShippingAgentOrganizationDTO.ToDTO(organization);
            return organizationDTO;
        }
        return null;
    }

    public async Task<ShippingAgentOrganizationWithRepresentativeDTO?> AddShippingAgentOrganizationWithRepresentative(
        ShippingAgentOrganizationWithRepresentativeDTO compositeDTO, List<string> errorMessages)
    {
        var organizationDTO = compositeDTO.GetOrganizationDTO();
        var representativeDTO = compositeDTO.GetRepresentativeDTO();


        ShippingAgentOrganization? existingOrganizationLegalName = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByLegalNameAsync(organizationDTO.LegalName!);
        if (existingOrganizationLegalName != null)
        {
            errorMessages.Add("A Shipping Agent Organization with the same legal name already exists.");
            return null;
        }

        ShippingAgentOrganization? existingOrganizationCode = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByCodeAsync(organizationDTO.Code!);
        if (existingOrganizationCode != null)
        {
            errorMessages.Add("A Shipping Agent Organization with the same code already exists.");
            return null;
        }
        ShippingAgentOrganization? existingOrganizationTaxNumber = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByTaxNumberAsync(organizationDTO.TaxNumber!);
        if (existingOrganizationTaxNumber != null)
        {
            errorMessages.Add("A Shipping Agent Organization with the same tax number already exists.");
            return null;
        }
        ShippingAgentOrganization? existingOrganizationAddress = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByAddressAsync(organizationDTO.Address!);
        if (existingOrganizationAddress != null)
        {
            errorMessages.Add("A Shipping Agent Organization with the same address already exists.");
            return null;
        }

        try
        {

            ShippingAgentOrganization shippingAgentOrganization = ShippingAgentOrganizationDTO.ToDomain(organizationDTO);
            ShippingAgentOrganization savedOrganization = await _shippingAgentOrganizationRepository.AddShippingAgentOrganization(shippingAgentOrganization);

            representativeDTO.OrganizationName = savedOrganization.LegalName;
            RepresentativeDTO? savedRepresentativeDTO = await _representativeService.AddRepresentative(representativeDTO, errorMessages);

            if (savedRepresentativeDTO == null)
            {
                errorMessages.Add("Failed to create representative for the organization. Organization was created successfully.");
                return null;
            }

            var result = new ShippingAgentOrganizationWithRepresentativeDTO
            {
                Id = savedOrganization.Id,
                Code = savedOrganization.Code,
                LegalName = savedOrganization.LegalName,
                AlternativeName = savedOrganization.AlternativeName,
                Address = savedOrganization.Address,
                TaxNumber = savedOrganization.TaxNumber,
                LastModifiedAt = savedOrganization.LastModifiedAt,
                RepresentativeName = savedRepresentativeDTO.Name,
                RepresentativeCitizenId = savedRepresentativeDTO.CitizenId,
                RepresentativeNationality = savedRepresentativeDTO.Nationality,
                RepresentativeEmail = savedRepresentativeDTO.Email,
                RepresentativePhoneNumber = savedRepresentativeDTO.PhoneNumber
            };

            return result;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"Error creating organization and representative: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> UpdateShippingAgentOrganization(long id, ShippingAgentOrganizationDTO organizationDTO, List<string> errorMessages)
    {
        ShippingAgentOrganization? organization = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByIdAsync(id);
        if (organization == null)
        {
            errorMessages.Add("Shipping Agent Organization not found.");
            return false;
        }
        if (string.IsNullOrWhiteSpace(organizationDTO.LegalName))
        {
            errorMessages.Add("Legal name cannot be null or empty.");
            return false;
        }
        if (string.IsNullOrWhiteSpace(organizationDTO.AlternativeName))
        {
            errorMessages.Add("Alternative name cannot be null or empty.");
            return false;
        }
        if (string.IsNullOrWhiteSpace(organizationDTO.Address))
        {
            errorMessages.Add("Address cannot be null or empty.");
            return false;
        }
        if (string.IsNullOrWhiteSpace(organizationDTO.TaxNumber))
        {
            errorMessages.Add("Tax number cannot be null or empty.");
            return false;
        }

        ShippingAgentOrganization? shippingAgentOrganizationLegalName = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByLegalNameAsync(organizationDTO.LegalName);
        if (shippingAgentOrganizationLegalName != null && shippingAgentOrganizationLegalName.Id != id)
        {
            errorMessages.Add("Another Shipping Agent Organization with the same legal name already exists.");
            return false;
        }
        ShippingAgentOrganization? shippingAgentOrganizationByAddress = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByAddressAsync(organizationDTO.Address);
        if (shippingAgentOrganizationByAddress != null && shippingAgentOrganizationByAddress.Id != id)
        {
            errorMessages.Add("Another Shipping Agent Organization with the same address already exists.");
            return false;
        }
        ShippingAgentOrganization? shippingAgentOrganizationByTaxNumber = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByTaxNumberAsync(organizationDTO.TaxNumber);
        if (shippingAgentOrganizationByTaxNumber != null && shippingAgentOrganizationByTaxNumber.Id != id)
        {
            errorMessages.Add("Another Shipping Agent Organization with the same tax number already exists.");
            return false;
        }
        ShippingAgentOrganization? shippingAgentOrganizationByCode = await _shippingAgentOrganizationRepository.GetShippingAgentOrganizationByCodeAsync(organizationDTO.Code!);
        if (shippingAgentOrganizationByCode != null && shippingAgentOrganizationByCode.Id != id)
        {
            errorMessages.Add("Another Shipping Agent Organization with the same code already exists.");
            return false;
        }

        try
        {
            ShippingAgentOrganizationDTO.UpdateToDomain(organization, organizationDTO);
            await _shippingAgentOrganizationRepository.Update(organization, errorMessages);
            return true;
        }
        catch (Exception ex)
        {
            errorMessages.Add($"An error occurred: {ex.Message}");
            return false;
        }
    }
}