import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { description } = await request.json()

    if (!description) {
      return NextResponse.json(
        { error: 'Image description is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.TOGETHER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Together AI API key not configured' },
        { status: 500 }
      )
    }

    // Call Together AI image generation API
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.2-dev',
        prompt: description,
        width: 1024,
        height: 768,
        steps: 20, // FLUX.2-dev works well with more steps for better quality
        n: 1, // Generate 1 image
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Together AI error:', error)
      return NextResponse.json(
        { error: error.error?.message || 'Image generation failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Together AI returns base64 encoded image in data[0].b64_json
    if (!data.data || !data.data[0]) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      )
    }

    const base64Image = data.data[0].b64_json
    const imageUrl = `data:image/png;base64,${base64Image}`

    return NextResponse.json({
      url: imageUrl,
      description: description
    })

  } catch (error: any) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}
