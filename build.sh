
NAME="ZeroTab"
VERSION="1.1.0"

# Start

# Clean output folder
mkdir -p publish
rm -fr publish/*

# Build app
npx gulp build

# Copy files to result folder
cp dist/* \
   src/*.png \
   src/manifest.json \
   publish/
cd publish

# Update version
sed -i "" -e "s/version_auto/$VERSION/g" manifest.json

# Go to folder for create archive
zip -r -X "$NAME-$VERSION.zip" *

echo "---\nSuccess! \nPackage here: publish/$NAME-$VERSION.zip"