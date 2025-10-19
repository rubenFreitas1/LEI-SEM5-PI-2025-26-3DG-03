using DataModel.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DataModel.Configurations
{
    public class RepresentativeConfiguration : IEntityTypeConfiguration<RepresentativeDataModel>
    {
        public void Configure(EntityTypeBuilder<RepresentativeDataModel> builder)
        {
            builder.HasKey(r => r.Id);

            builder.HasIndex(r => r.CitizenId).IsUnique();

            builder.HasIndex(r => r.Email).IsUnique();

            builder.HasIndex(r => r.PhoneNumber).IsUnique();

            builder.HasOne(r => r.Organization)
                .WithMany()
                .HasForeignKey("OrganizationId")
                .IsRequired();

        }
    }
}