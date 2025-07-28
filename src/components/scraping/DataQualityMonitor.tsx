import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, 
  Star, MapPin, Phone, Globe, Image, FileText
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface QualityMetrics {
  overall: number;
  completeness: number;
  accuracy: number;
  freshness: number;
  breakdown: {
    name: number;
    address: number;
    contact: number;
    images: number;
    description: number;
  };
}

interface QualityIssue {
  id: string;
  place_name: string;
  issue_type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  created_at: string;
}

export const DataQualityMonitor: React.FC = () => {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    overall: 0,
    completeness: 0,
    accuracy: 0,
    freshness: 0,
    breakdown: {
      name: 0,
      address: 0,
      contact: 0,
      images: 0,
      description: 0
    }
  });
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQualityData();
    const interval = setInterval(loadQualityData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQualityData = async () => {
    try {
      setIsLoading(true);

      // Get all places for quality analysis
      const { data: places } = await supabase
        .from('places')
        .select('*');

      if (places) {
        const metrics = calculateQualityMetrics(places);
        setQualityMetrics(metrics);

        // Generate quality issues
        const issues = generateQualityIssues(places);
        setQualityIssues(issues);
      }
    } catch (error) {
      console.error('Error loading quality data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateQualityMetrics = (places: any[]): QualityMetrics => {
    if (places.length === 0) {
      return {
        overall: 0,
        completeness: 0,
        accuracy: 0,
        freshness: 0,
        breakdown: { name: 0, address: 0, contact: 0, images: 0, description: 0 }
      };
    }

    const scores = places.map(place => {
      const nameScore = place.name ? 100 : 0;
      const addressScore = place.address ? 100 : 0;
      const contactScore = 0; // No contact fields in current schema
      const imagesScore = (place.photos && place.photos.length > 0) ? 100 : 0;
      const descriptionScore = 0; // No description field in current schema

      const completeness = (nameScore + addressScore + contactScore + imagesScore + descriptionScore) / 5;
      const accuracy = place.rating ? Math.min(place.rating * 20, 100) : 50; // Convert 0-5 rating to 0-100
      const freshness = 85; // Mock freshness score

      return {
        overall: (completeness + accuracy + freshness) / 3,
        completeness,
        accuracy,
        freshness,
        breakdown: {
          name: nameScore,
          address: addressScore,
          contact: contactScore,
          images: imagesScore,
          description: descriptionScore
        }
      };
    });

    // Calculate averages
    const avgMetrics = scores.reduce((acc, score) => ({
      overall: acc.overall + score.overall,
      completeness: acc.completeness + score.completeness,
      accuracy: acc.accuracy + score.accuracy,
      freshness: acc.freshness + score.freshness,
      breakdown: {
        name: acc.breakdown.name + score.breakdown.name,
        address: acc.breakdown.address + score.breakdown.address,
        contact: acc.breakdown.contact + score.breakdown.contact,
        images: acc.breakdown.images + score.breakdown.images,
        description: acc.breakdown.description + score.breakdown.description
      }
    }), {
      overall: 0,
      completeness: 0,
      accuracy: 0,
      freshness: 0,
      breakdown: { name: 0, address: 0, contact: 0, images: 0, description: 0 }
    });

    const count = places.length;
    return {
      overall: Math.round(avgMetrics.overall / count),
      completeness: Math.round(avgMetrics.completeness / count),
      accuracy: Math.round(avgMetrics.accuracy / count),
      freshness: Math.round(avgMetrics.freshness / count),
      breakdown: {
        name: Math.round(avgMetrics.breakdown.name / count),
        address: Math.round(avgMetrics.breakdown.address / count),
        contact: Math.round(avgMetrics.breakdown.contact / count),
        images: Math.round(avgMetrics.breakdown.images / count),
        description: Math.round(avgMetrics.breakdown.description / count)
      }
    };
  };

  const generateQualityIssues = (places: any[]): QualityIssue[] => {
    const issues: QualityIssue[] = [];

    places.forEach(place => {
      if (!place.name) {
        issues.push({
          id: `${place.id}-name`,
          place_name: place.name || 'Unnamed Place',
          issue_type: 'missing_name',
          severity: 'high',
          description: 'Place is missing a name',
          created_at: new Date().toISOString()
        });
      }

      if (!place.address) {
        issues.push({
          id: `${place.id}-address`,
          place_name: place.name || 'Unnamed Place',
          issue_type: 'missing_address',
          severity: 'medium',
          description: 'Place is missing an address',
          created_at: new Date().toISOString()
        });
      }

      if (!place.photos || place.photos.length === 0) {
        issues.push({
          id: `${place.id}-images`,
          place_name: place.name || 'Unnamed Place',
          issue_type: 'missing_images',
          severity: 'low',
          description: 'Place has no images',
          created_at: new Date().toISOString()
        });
      }
    });

    return issues.slice(0, 20); // Limit to 20 most recent issues
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading quality metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Data Quality Monitor
          </h1>
          <p className="text-gray-400">
            Track and improve the quality of your tourism data
          </p>
        </motion.div>

        {/* Quality Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QualityCard
            title="Overall Quality"
            score={qualityMetrics.overall}
            icon={<BarChart3 className="w-5 h-5" />}
            description="Combined quality score"
          />
          
          <QualityCard
            title="Completeness"
            score={qualityMetrics.completeness}
            icon={<CheckCircle className="w-5 h-5" />}
            description="Data field completion"
          />
          
          <QualityCard
            title="Accuracy"
            score={qualityMetrics.accuracy}
            icon={<TrendingUp className="w-5 h-5" />}
            description="Data accuracy score"
          />
          
          <QualityCard
            title="Freshness"
            score={qualityMetrics.freshness}
            icon={<Star className="w-5 h-5" />}
            description="Data recency score"
          />
        </div>

        {/* Quality Breakdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Quality Breakdown</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <QualityBreakdownItem
              label="Names"
              score={qualityMetrics.breakdown.name}
              icon={<FileText className="w-4 h-4" />}
            />
            
            <QualityBreakdownItem
              label="Addresses"
              score={qualityMetrics.breakdown.address}
              icon={<MapPin className="w-4 h-4" />}
            />
            
            <QualityBreakdownItem
              label="Contact"
              score={qualityMetrics.breakdown.contact}
              icon={<Phone className="w-4 h-4" />}
            />
            
            <QualityBreakdownItem
              label="Images"
              score={qualityMetrics.breakdown.images}
              icon={<Image className="w-4 h-4" />}
            />
            
            <QualityBreakdownItem
              label="Descriptions"
              score={qualityMetrics.breakdown.description}
              icon={<Globe className="w-4 h-4" />}
            />
          </div>
        </motion.div>

        {/* Quality Issues */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Quality Issues</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {qualityIssues.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No quality issues found
              </div>
            ) : (
              qualityIssues.map((issue) => (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">{issue.place_name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getSeverityColor(issue.severity)}`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm opacity-80">{issue.description}</p>
                    </div>
                    
                    <button className="text-blue-400 hover:text-blue-300 text-sm">
                      Fix
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Quality Card Component
const QualityCard: React.FC<{
  title: string;
  score: number;
  icon: React.ReactNode;
  description: string;
}> = ({ title, score, icon, description }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${getScoreColor(score)} opacity-10 rounded-full -mr-16 -mt-16`} />
      
      <div className="relative">
        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${getScoreColor(score)} mb-3`}>
          {icon}
        </div>
        
        <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white">{score}%</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </motion.div>
  );
};

// Quality Breakdown Item Component
const QualityBreakdownItem: React.FC<{
  label: string;
  score: number;
  icon: React.ReactNode;
}> = ({ label, score, icon }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-slate-700 rounded-lg p-4 text-center">
      <div className="flex justify-center mb-2">
        <div className={`p-2 rounded-lg ${getScoreColor(score)} bg-current/10`}>
          {icon}
        </div>
      </div>
      <h4 className="text-white font-medium mb-1">{label}</h4>
      <p className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</p>
    </div>
  );
};