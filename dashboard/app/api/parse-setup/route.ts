import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const SYSTEM_PROMPT = `You are a parser that extracts onboarding screen information from a structured setup prompt.

The input follows this format (but may have variations):

SCREEN: ComponentName
DESCRIPTION: What the screen does
VARIABLES:
- variable_name: type

Where type is: string, number, boolean, list, or any.

Your job is to extract ALL screens and return valid JSON only. No markdown, no backticks, no explanation.

Return format:
{
  "screens": [
    {
      "component_name": "ComponentName",
      "description": "What the screen does",
      "variables": [
        { "name": "variable_name", "type": "string" }
      ]
    }
  ]
}

Rules:
- component_name should be PascalCase (the exact React component name)
- variable names should be snake_case
- type must be one of: "string", "number", "boolean", "list", "any"
- If a screen has "VARIABLES: none" or no variables, set "variables": []
- Parse as many screens as you find
- If the input is malformed or not a setup prompt, return: { "error": "Could not parse setup prompt. Please check the format." }
- ONLY return JSON. Nothing else.`

async function callAnthropic(prompt: string): Promise<{ text: string; inputTokens: number; outputTokens: number; model: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No Anthropic key')

  const anthropic = new Anthropic({ apiKey })
  const model = 'claude-haiku-4-5-20251001'

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return {
    text,
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
    model,
  }
}

async function callOpenAI(prompt: string): Promise<{ text: string; inputTokens: number; outputTokens: number; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('No OpenAI key')

  const openai = new OpenAI({ apiKey })
  const model = 'gpt-4o-mini'

  const response = await openai.chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  })

  const text = response.choices[0]?.message?.content || ''
  return {
    text,
    inputTokens: response.usage?.prompt_tokens || 0,
    outputTokens: response.usage?.completion_tokens || 0,
    model,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check credits
    const { data: creditsData } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single()

    const currentCredits = creditsData?.credits_remaining ? Number(creditsData.credits_remaining) : 0

    if (currentCredits < 0.05) {
      return NextResponse.json(
        { error: 'Insufficient credits', message: 'You need credits to use the setup feature.' },
        { status: 402 }
      )
    }

    const { prompt } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return NextResponse.json({ error: 'Please paste a valid setup prompt' }, { status: 400 })
    }

    // Try Anthropic first, fall back to OpenAI
    let result: { text: string; inputTokens: number; outputTokens: number; model: string }

    try {
      result = await callAnthropic(prompt.trim())
    } catch (anthropicErr: any) {
      console.warn('Anthropic failed, falling back to OpenAI:', anthropicErr?.status || anthropicErr?.message)
      try {
        result = await callOpenAI(prompt.trim())
      } catch (openaiErr: any) {
        console.error('Both AI providers failed:', openaiErr?.message)
        return NextResponse.json(
          { error: 'AI services are temporarily unavailable. Please try again in a moment.' },
          { status: 503 }
        )
      }
    }

    const { text, inputTokens, outputTokens, model } = result

    // Parse JSON response
    let data
    try {
      data = JSON.parse(text)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
    }

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    if (!data.screens || !Array.isArray(data.screens) || data.screens.length === 0) {
      return NextResponse.json({ error: 'No screens found in the setup prompt. Please check the format.' }, { status: 400 })
    }

    // Validate and normalize each screen
    const screens = data.screens.map((s: any) => ({
      component_name: String(s.component_name || '').trim(),
      description: String(s.description || '').trim(),
      variables: Array.isArray(s.variables) ? s.variables.map((v: any) => ({
        name: String(v.name || '').trim().replace(/\s+/g, '_'),
        type: ['string', 'number', 'boolean', 'list', 'any'].includes(v.type) ? v.type : 'any',
      })).filter((v: any) => v.name.length > 0) : [],
    })).filter((s: any) => s.component_name.length > 0)

    // Deduct credits
    Promise.resolve(supabase.rpc('deduct_user_credits', {
      p_user_id: user.id,
      p_flow_id: 'setup',
      p_screen_id: 'setup',
      p_prompt_type: 'edit',
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens,
      p_model_name: model,
      p_conversation_turn: 1,
    })).catch(console.error)

    return NextResponse.json({ screens })
  } catch (error: any) {
    console.error('Parse setup error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
