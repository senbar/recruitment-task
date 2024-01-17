export type ServiceYear = 2020 | 2021 | 2022;
export type ServiceType = "Photography" | "VideoRecording" | "BlurayPackage" | "TwoDayEvent" | "WeddingSession";

type YearlyPriceServices = "Photography" | "VideoRecording";
type DiscountedServiceTypes = "WeddingIn2022WithPhotographyDiscount" | "WeddingSessionDiscounted"

type ServiceTypeWithDiscounts = ServiceType | DiscountedServiceTypes
type ServiceYearPrice = { [year in ServiceYear]: number }
type PriceList = { [service in ServiceTypeWithDiscounts]: service extends YearlyPriceServices ? ServiceYearPrice : number }

const basePricesList: PriceList = {
    Photography: {
        2020: 1700,
        2021: 1800,
        2022: 1900
    },
    VideoRecording: {
        2020: 1700,
        2021: 1800,
        2022: 1900
    },
    WeddingSession: 600,
    BlurayPackage: 300,
    TwoDayEvent: 400,
    WeddingSessionDiscounted: 300,
    WeddingIn2022WithPhotographyDiscount: 0
}

const packageDiscountPrices: { [year in ServiceYear]: number } = {
    2020: 2200,
    2021: 2300,
    2022: 2500
};

export const updateSelectedServices = (
    previouslySelectedServices: ServiceType[],
    action: { type: "Select" | "Deselect"; service: ServiceType }
) => {
    switch (action.type) {
        case "Select": {
            if (action.service === "BlurayPackage" && !previouslySelectedServices.includes("VideoRecording")) {
                return previouslySelectedServices;
            }
            if (action.service === "TwoDayEvent"
                && !previouslySelectedServices.some(service => service === "Photography" || service === "VideoRecording")) {

                return previouslySelectedServices;
            }

            return Array.from(new Set([...previouslySelectedServices, action.service]));
        }
        case "Deselect": {
            const deselectService = [action.service];

            if (action.service === "VideoRecording") {
                deselectService.push("BlurayPackage");
            }

            const allPhotoVideoRemoved = () =>
                (action.service === "Photography" && !previouslySelectedServices.includes("VideoRecording"))
                || (action.service === "VideoRecording" && !previouslySelectedServices.includes("Photography"))
            if (allPhotoVideoRemoved()) {
                deselectService.push("TwoDayEvent");
            }

            return previouslySelectedServices.filter(selectedService => !deselectService.includes(selectedService));
        }
    }
};


export const calculatePrice = (selectedServices: ServiceType[], selectedYear: ServiceYear) => {
    let basePrice = selectedServices.reduce((acc, service) => {
        let servicePrice = 0;
        servicePrice = basePricesList[service][selectedYear] ?? basePricesList[service] as number;
        return acc + servicePrice;
    }, 0
    );

    let finalPrice = basePrice;

    // maybe I would pack these discounts into monad and run functions for them in pipe, but I won't overcomplicate here
    // also depends on my coworkers fondness of fp
    if (selectedServices.includes("Photography") && selectedServices.includes("VideoRecording")) {
        finalPrice -= (basePricesList.Photography[selectedYear] + basePricesList.VideoRecording[selectedYear] - packageDiscountPrices[selectedYear]);
    }

    if (selectedServices.includes("WeddingSession")) {
        const weddingSessionDiscounts: number[] = []
        if (selectedServices.includes("Photography") || selectedServices.includes("VideoRecording")) {
            weddingSessionDiscounts.push(basePricesList.WeddingSession - basePricesList.WeddingSessionDiscounted);
        }
        if (selectedYear === 2022 && selectedServices.includes("Photography")) {
            weddingSessionDiscounts.push(basePricesList.WeddingSession - basePricesList.WeddingIn2022WithPhotographyDiscount);
        }

        const biggestWeddingDiscount = weddingSessionDiscounts.length > 0 ? Math.max(...weddingSessionDiscounts) : 0
        finalPrice -= biggestWeddingDiscount;
    }

    finalPrice = finalPrice < 0 ? 0 : finalPrice;

    return { basePrice, finalPrice };
};
