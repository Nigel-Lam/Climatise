## Script to turn ABS shapefile loc markers to long lat


import geopandas as gpd

gdf = gpd.read_file("SA3_2021_AUST_GDA2020.shp")

print(gdf.columns)

gdf['longitude'] = gdf.centroid.x
gdf['latitude'] = gdf.centroid.y

gdf[['SA3_CODE21', 'SA3_NAME21', 'longitude', 'latitude']].to_csv("SA3_centroids.csv", index=False)