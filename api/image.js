import OpenAI from 'openai';
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(400).json({error:'OPENAI_API_KEY pa mete sou Vercel.'});
  try{
    const {prompt,size}=req.body||{};
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const img=await client.images.generate({model:'gpt-image-1',prompt:'Understand Haitian Creole and create a professional image. Request: '+(prompt||''),size:size||'1536x864'});
    res.status(200).json({image:'data:image/png;base64,'+img.data[0].b64_json});
  }catch(e){res.status(500).json({error:e.message});}
}
