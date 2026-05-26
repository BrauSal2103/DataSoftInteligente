import { ButtonHTMLAttributes } from 'react';
export default ({className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>)=><button className={`rounded-xl bg-[#EF0015] px-4 py-2 font-semibold hover:brightness-110 disabled:opacity-50 ${className}`} {...props}/>;
