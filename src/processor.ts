import axios from 'axios';
import { createClient } from 'redis';

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
    async () => {

        const redisClient = createClient();



        const processorDefault = await getServiceHealthDefault();
        const processorFallback = await getServiceHealthFallback();

        if(!processorDefault.failing){
            
        }

    }
);