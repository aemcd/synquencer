/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	output: "standalone",
	env: {
		USE_AZURE: process.env.USE_AZURE,
		FLUID_TENANT_ID: process.env.FLUID_TENANT_ID,
		FLUID_TENANT_KEY: process.env.FLUID_TENANT_KEY,
		FLUID_API_URL: process.env.FLUID_API_URL,
	},
};
module.exports = nextConfig;
