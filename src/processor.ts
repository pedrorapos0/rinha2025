import axios from 'axios';
import { listPaymentsReceived } from './dataStoreRedis';

const payment_processor_default ='http://localhost:8001/payments';
const payment_processor_fallback ='http://localhost:8002/payments';

const service_health_default ='http://localhost:8001/payments/service-health';
const service_health_fallback ='http://localhost:8002/payments/service-health';



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
    await axios.post(payment_processor_default,{
        payment
     });
}

export async function paymentProcessorFallback(payment: Payment) {
     await axios.post(payment_processor_fallback,{
        payment
     });
}

export async function getServiceHealthDefault(): Promise<ResponseServiceHealth> {
    const response = await axios.get(service_health_default);
    return response.data;
}

export async function getServiceHealthFallback(): Promise<ResponseServiceHealth> {
    const response = await axios.get(service_health_fallback);
    return response.data;
     
}


(
    async function processorPayment(): Promise<void> {
        const processorDefault = await getServiceHealthDefault();
        const processorFallback = await getServiceHealthFallback();

        if(!processorDefault.failing && !processorFallback.failing){
            let payments_to_process: Promise<void>[] =[];
            const payment_received = await listPaymentsReceived();

            if(!payment_received ||payment_received.length===0){
                return;
            }
                for(let i=0; i<payment_received.length; i++){
                    const paymentPending = paymentProcessorDefault(payment_received[i]);
                    payments_to_process.push(paymentPending);               
                }
                await Promise.all(payments_to_process);
            
        }if(processorDefault.failing && !processorFallback.failing){

        }

    }
);