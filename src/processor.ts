import axios from 'axios';
import { createConnectionRedis, listPaymentsReceived, updatePaymentProcessorField } from './dataStoreRedis';
import 'dotenv/config'

const payment_processor_default =`${process.env.PROCESSOR_DEFAULT_URL}/payments`;
const payment_processor_fallback =`${process.env.PROCESSOR_FALLBACK_URL}/payments`;

const service_health_default =`${process.env.PROCESSOR_DEFAULT_URL}/payments/service-health`;
const service_health_fallback =`${process.env.PROCESSOR_FALLBACK_URL}/payments/service-health`;



export type Payment = {
    correlationId: string;
    amount: number;
    requestedAt: string;
};

export type ResponseServiceHealth = {
    failing: boolean,
    minResponseTime: number
};



export async function paymentProcessorDefault(payment: Payment) {
    try{
    await axios.post(payment_processor_default,payment);
    }catch(err){
        console.log('Error: '+ err);
    }
}

export async function paymentProcessorFallback(payment: Payment) {
    try{
     await axios.post(payment_processor_fallback,
        payment
     );
     }catch(err){
        console.log('Error: '+ err);
    }
}

export async function getServiceHealthDefault(): Promise<ResponseServiceHealth> {
    const response = await axios.get(service_health_default);
    return response.data;
}

export async function getServiceHealthFallback(): Promise<ResponseServiceHealth> {
    const response = await axios.get(service_health_fallback);
    return response.data;
     
}



    async function processorPayment(): Promise<void> {
      
        await createConnectionRedis();
        const processorDefault = await getServiceHealthDefault();
        const processorFallback = await getServiceHealthFallback();

        if(!processorDefault.failing && !processorFallback.failing){
            let payments_to_process: Promise<void>[] =[];
            let update_payments_to_process: Promise<void>[] =[];
            const payment_received = await listPaymentsReceived();


           if(!payment_received ||payment_received.length===0){
                return;
            }
                for(let i=0; i<payment_received.length; i++){
                        const paymentPending = paymentProcessorDefault(payment_received[i] as Payment);
                        const updatePaymentPending = updatePaymentProcessorField(payment_received[i] as Payment, 'default');
                        payments_to_process.push(paymentPending);   
                        update_payments_to_process.push(updatePaymentPending);            

                }
                await Promise.all(payments_to_process);
                await Promise.all(update_payments_to_process);
                
                
        if(processorDefault.failing && !processorFallback.failing){
            let payments_to_process: Promise<void>[] =[];
            let update_payments_to_process: Promise<void>[] =[];
            const payment_received = await listPaymentsReceived();
             if(!payment_received ||payment_received.length > 0){
                return;
            }
                for(let i=0; i<payment_received.length; i++){
                        const paymentPending = paymentProcessorFallback(payment_received[i] as Payment);
                        const updatePaymentPending = updatePaymentProcessorField(payment_received[i] as Payment, 'fallback');
                        payments_to_process.push(paymentPending); 
                        update_payments_to_process.push(updatePaymentPending);              

                }
                await Promise.all(payments_to_process);
                await Promise.all(update_payments_to_process);
        }
       
    }
}

setInterval(async () => {
    await processorPayment();
}, 5000);
