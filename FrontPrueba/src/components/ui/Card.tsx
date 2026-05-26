import { ReactNode } from 'react';
export default ({children,className=''}:{children:ReactNode;className?:string})=><div className={`rounded-2xl border border-[#1F2937] bg-[#18181B] p-4 ${className}`}>{children}</div>;
