namespace Domain.IRepository
{
    using Domain.Model.Resources;
    using Domain.Model;
    using System.Collections.Generic;

    public interface IPhysicalResourceRepository : IGenericRepository<PhysicalResource>
    {
        Task<IEnumerable<PhysicalResource>> GetAllPhysicalResourcesAsync();
        Task<PhysicalResource?> GetPhysicalResourceByIdAsync(long id);
        Task<PhysicalResource?> GetPhysicalResourceByCodeAsync(string code);
        Task<IEnumerable<PhysicalResource>> GetPhysicalResourceByDescriptionAsync(string description);
        Task<IEnumerable<PhysicalResource>> GetPhysicalResourceByKindAsync(PhysicalResourceKind kind);
        Task<IEnumerable<PhysicalResource>> GetPhysicalResourceByStatusAsync(ResourceStatus status);
        Task<PhysicalResource> AddPhysicalResource(PhysicalResource resource);
        Task<PhysicalResource?> Update(PhysicalResource resource, List<string> errorMessages);
    }
}
