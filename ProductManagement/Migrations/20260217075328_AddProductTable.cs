using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProductManagement.Migrations
{
    /// <inheritdoc />
    public partial class AddProductTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "NEWID()"),
                    ProductCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "varchar(255)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    InStock = table.Column<long>(type: "bigint", nullable: false),
                    MinInStock = table.Column<long>(type: "bigint", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<bool>(type: "bit", nullable: false),
                    InStockStatus = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Products_Providers_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "Providers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d"),
                column: "Password",
                value: "$2a$11$x8R42Vk8iU15JenukN2rpeJPeEaTyjorZyssbRHsmWRFNZ13Xh0Q2");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ProviderId",
                table: "Products",
                column: "ProviderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d"),
                column: "Password",
                value: "$2a$11$YH00Mf8sagJs/6nSGDYfvuM5m05Xqh5YhUEUKqtQkGj6T4Np17phS");
        }
    }
}
