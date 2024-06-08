package main

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"log"
	"math"
	"os"
	"strings"

	"github.com/fogleman/gg"
)

type PaletteItem struct {
	Text string `json:"text"`
	Rect string `json:"rect"`
}

type Palette map[string]PaletteItem

var (
	width    = 30.0
	gap      = width / 12.5
	round    = width / 10
	noLetter = false
)

func stringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func getFilename(word string, guess string) string {
	if noLetter {
		return "src/img/" + word + "_" + guess + "_noletter.png"
	}

	return "src/img/" + word + "_" + guess + ".png"
}

func generateImage(word string, guess string) {
	filename := getFilename(word, guess)
	if _, err := os.Stat(filename); !os.IsNotExist(err) {
		return
	}

	imgWidth := float64(len(word))*(width+gap) - gap
	imgHeight := width

	dc := gg.NewContext(int(imgWidth), int(imgHeight))

	dc.SetColor(color.Transparent)
	dc.Clear()

	fontSize := math.Min(width, width)
	err := dc.LoadFontFace("src/fonts/Roboto-Bold.ttf", fontSize-(fontSize/5))
	if err != nil {
		log.Fatal(err)
	}

	for i, letter := range guess {
		// ok: {text, rect}, place: {text, rect}, no: {text, rect}
		colorPalette := Palette{
			"no":    {Text: "#d4c8bb", Rect: "#191818"},
			"place": {Text: "#191818", Rect: "#d4c8bb"},
			"ok":    {Text: "#d4c8bb", Rect: "#7b60a6"},
		}

		colorType := "no"

		if i < len(word) && letter == rune(word[i]) {
			colorType = "ok"
		} else if stringInSlice(string(letter), strings.Split(word, "")) {
			colorType = "place"
		}

		x := float64(i) * (width + gap)
		y := 0.0

		dc.SetHexColor(colorPalette[colorType].Rect)
		dc.DrawRoundedRectangle(x, y, width, width, round)
		dc.Fill()

		if !noLetter {
			dc.SetHexColor(colorPalette[colorType].Text)
			dc.DrawStringAnchored(strings.ToUpper(string(letter)), x+width/2, y+width/2, 0.5, 0.5)
		}
	}

	err = dc.SavePNG(filename)
	if err != nil {
		log.Fatal(err)
	}
}

func MergeImages(images []image.Image, gap int) (image.Image, error) {
	if len(images) == 0 {
		return nil, nil
	}

	maxWidth := 0
	totalHeight := 0

	for _, img := range images {
		bounds := img.Bounds()
		if bounds.Dx() > maxWidth {
			maxWidth = bounds.Dx()
		}
		totalHeight += bounds.Dy() + gap
	}

	// Remove the last gap
	totalHeight -= gap

	merged := image.NewRGBA(image.Rect(0, 0, maxWidth, totalHeight))
	draw.Draw(merged, merged.Bounds(), &image.Uniform{color.Transparent}, image.Point{}, draw.Src)

	yOffset := 0
	for _, img := range images {
		bounds := img.Bounds()
		draw.Draw(merged, image.Rect(0, yOffset, bounds.Dx(), yOffset+bounds.Dy()), img, bounds.Min, draw.Over)
		yOffset += bounds.Dy() + gap
	}

	return merged, nil
}

func loadImage(filename string) (image.Image, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return nil, err
	}
	return img, nil
}

func inArray(needle string, haystack []string) int {
	for i, item := range haystack {
		if item == needle {
			return i
		}
	}
	return -1
}

func main() {
	args := os.Args[1:]

	for i, arg := range args {
		args[i] = strings.ToLower(arg)
	}

	if index := inArray("--no-letter", args); index > -1 {
		args = append(args[:index], args[index+1:]...)
		noLetter = true
	}

	if len(args)%2 != 0 {
		log.Fatal("Please provide an even number of words.")
	}

	for i := 0; i < len(args); i += 2 {
		word := args[i]
		guess := args[i+1]
		generateImage(word, guess)
	}

	imageFiles := []string{}

	for i := 0; i < len(args); i += 2 {
		word := args[i]
		guess := args[i+1]
		filename := getFilename(word, guess)
		imageFiles = append(imageFiles, filename)
	}

	var images []image.Image

	for _, file := range imageFiles {
		img, err := loadImage(file)
		if err != nil {
			panic(err)
		}
		images = append(images, img)
	}

	mergedImage, err := MergeImages(images, int(gap))
	if err != nil {
		panic(err)
	}

	// Encode the merged image to base64
	var buf bytes.Buffer
	err = png.Encode(&buf, mergedImage)
	if err != nil {
		panic(err)
	}
	base64Str := base64.StdEncoding.EncodeToString(buf.Bytes())

	// Output the base64 string
	fmt.Println(base64Str)
}
