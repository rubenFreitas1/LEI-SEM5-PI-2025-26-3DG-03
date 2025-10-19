using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataModel.Configurations
{
    public class ShippingAgentOrganizationConfiguration : IEntityTypeConfiguration<ShippingAgentOrganizationDataModel>
    {
        public void Configure(EntityTypeBuilder<ShippingAgentOrganizationDataModel> builder)
        {
            builder.HasKey(sa => sa.Id);

            builder.HasIndex(sa => sa.Code)
                .IsUnique();

            builder.HasIndex(sa => sa.LegalName).IsUnique();

            builder.HasIndex(sa => sa.TaxNumber)
                .IsUnique();

            builder.HasIndex(sa => sa.Address).IsUnique();


        }
    }
}