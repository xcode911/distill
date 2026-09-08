export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    if (request.method === 'OPTIONS') return new Response(null,{headers:cors});
    if (request.method !== 'POST') return new Response('Method Not Allowed',{status:405,headers:cors});
    if (!env.DEEPSEEK_API_KEY) return new Response(JSON.stringify({error:'DEEPSEEK_API_KEY is not configured'}),{status:503,headers:{...cors,'Content-Type':'application/json'}});
    try {
      const body = await request.json();
      if (!body.imageBase64 || typeof body.imageBase64 !== 'string') throw new Error('imageBase64 is required');
      const mime = body.mime || 'image/jpeg';
      const prompt = body.prompt || 'Describe this image and identify useful public location clues. Give a cautious location guess with confidence and evidence; do not claim certainty without evidence.';
      const response = await fetch('https://api.deepseek.com/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${env.DEEPSEEK_API_KEY}`},
        body:JSON.stringify({
          model:'deepseek-v4-flash-vision-exp',
          messages:[{role:'user',content:[{type:'text',text:prompt},{type:'image_url',image_url:{url:`data:${mime};base64,${body.imageBase64}`,detail:'auto'}}]}],
          max_tokens:900
        })
      });
      const data = await response.json();
      if (!response.ok) return new Response(JSON.stringify({error:data?.error?.message||'DeepSeek request failed'}),{status:502,headers:{...cors,'Content-Type':'application/json'}});
      const text = data?.choices?.[0]?.message?.content || '';
      return new Response(JSON.stringify({analysis:text,description:text,evidence:'DeepSeek Vision analysis; verify important location claims independently.'}),{headers:{...cors,'Content-Type':'application/json'}});
    } catch (e) {
      return new Response(JSON.stringify({error:String(e?.message||e)}),{status:400,headers:{...cors,'Content-Type':'application/json'}});
    }
  }
};