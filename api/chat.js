import OpenAI from 'openai';
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(400).json({error:'OPENAI_API_KEY pa mete sou Vercel.'});
  try{
    const {message}=req.body||{};
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const r=await client.chat.completions.create({model:'gpt-4.1-mini',messages:[{role:'system',content:'Ou se Kovax Academy assistant. Ou konprann Kreyòl byen. Reponn kout, klè, pwofesyonèl.'},{role:'user',content:message||''}]});
    res.status(200).json({reply:r.choices[0].message.content});
  }catch(e){res.status(500).json({error:e.message});}
}
